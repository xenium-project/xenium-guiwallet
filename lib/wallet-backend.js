//const {dialog} = require('electron').remote;
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
var utils = require('../src/js/utils.js')
const { ipcMain } = require('electron')

const {
	Daemon,
	WalletBackend,
	LogLevel
} = require('turtlecoin-wallet-backend')
const {
	table
} = require('table')
const chalk = require('chalk')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class Wallet {
	constructor(newWallet, file, password, nodes, config) {
		// State variables
		this.synced = false
		this.connectedToDeadNode = false
		this.resetting = false
		this.daemonNum = 0

		this.newWallet = newWallet
		this.file = file
		this.password = password
		this.config = config
		this.nodes = nodes


		console.log(chalk.yellow(`Connecting to ${nodes[this.daemonNum].host}:${nodes[this.daemonNum].port}`))
		this.daemon = new Daemon(nodes[this.daemonNum].host, nodes[this.daemonNum].port)

		let wallet, err

		if (this.newWallet) {
			wallet = WalletBackend.createWallet(this.daemon, this.config.coinConfig)
		} else {
			[wallet, err] = WalletBackend.openWalletFromFile(this.daemon, this.file, this.password, this.config.coinConfig)
		}

		if (err) throw new Error(err)

		this.wallet = wallet
		this.wallet.start()

		this.walletAddress = this.wallet.getPrimaryAddress()
		console.log(chalk.green(`Successfully opened wallet with address ${this.walletAddress}!`))

		this.syncInterval = setInterval(() => this.syncTimer(), 500)
		this.syncTimer()

		this.wallet.on('incomingtx', (tx) => {
			if (this.connectedToDeadNode) return

			console.log(chalk.greenBright('Incoming transaction found!'))
			this.transactionFormatter(tx)
		})

		this.wallet.on('outgoingtx', (tx) => {
			if (this.connectedToDeadNode) return

			console.log(chalk.redBright('Outgoing transaction found!'))
			this.transactionFormatter(tx)
		})

		this.wallet.on('sync', (wHeight, nHeight) => {
			if (this.synced === false) {
				console.log(chalk.green(`Wallet synced! Wallet height: ${wHeight}, Network height: ${nHeight}`))
				this.synced = true
			}

			this.resetting = false
		})

		this.wallet.on('deadnode', () => {
			console.log('Dead node!')

			if (this.daemonNum + 1 === this.nodes.length) {
				this.connectedToDeadNode = true

				console.log(chalk.red(`All nodes for ${this.config.name} have been used, exiting...`))

				this.stopAndSave()
			} else {
				this.connectedToDeadNode = true

				this.daemonNum++
				this.daemon = new Daemon(this.nodes[this.daemonNum].host, this.nodes[this.daemonNum].port)

				console.log(chalk.yellowBright(`Swapping to node ${this.nodes[this.daemonNum].host}:${this.nodes[this.daemonNum].port}`))

				this.wallet.swapNode(this.daemon).then(() => {
					this.connectedToDeadNode = false
					this.synced = false
				})
			}
		})
	}

	save() {
		this.wallet.saveWalletToFile(this.file, this.password)

		return sleep(1000)
	}

	async stopAndSave() {
		clearInterval(this.syncInterval)

		this.resetting = false
		this.connectedToDeadNode = true

		this.save().then(() => this.wallet.stop())
	}

	reset(rescanHeight) {
		if (this.connectedToDeadNode) return

		if (isNaN(rescanHeight)) rescanHeight = 0

		console.log(chalk.grey(`Starting resync from height ${rescanHeight}, clearing wallet blocks...`))

		this.resetting = true

		this.wallet.reset(rescanHeight).then(() => console.log(chalk.blueBright('Reset started, please wait...\nYou can see the progress by typing "sync_status"')))
	}

	getBalance() {
		if (this.connectedToDeadNode) return

		const balance = this.wallet.getBalance()

		console.log(table([
			['Unlocked', `${this.prettyAmounts(balance[0])} ${this.config.coinConfig.ticker}`],
			['Locked', `${this.prettyAmounts(balance[1])} ${this.config.coinConfig.ticker}`],
			['Total', `${this.prettyAmounts(balance[0] + balance[1])} ${this.config.coinConfig.ticker}`]
		]))
	}

	getSyncStatus() {
		if (this.connectedToDeadNode) return

		console.log(table([
			['Wallet block height', `${this.syncStatus[0]} (${(this.syncStatus[0] / this.syncStatus[2] * 100).toFixed(2)}%)`],
			['Daemon block height', `${this.syncStatus[1]} (${(this.syncStatus[1] / this.syncStatus[2] * 100).toFixed(2)}%)`],
			['Network block height', this.syncStatus[2]]
		]))
	}

	logger(output) {

		ipcMain

	}

	prettyAmounts(amount) {
		amount = amount / (10 ** this.config.coinConfig.decimalPlaces)
		let decimalPlaces = this.config.decimalPlaces
		decimalPlaces = isNaN(decimalPlaces) ? 2 : decimalPlaces

		let i = parseInt(amount = Math.abs(Number(amount || 0)).toFixed(decimalPlaces)).toString(),
			j = (i.length > 3) ? i.length % 3 : 0

		return (j ? i.substr(0, j) + ',' : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1,") + (decimalPlaces ? '.' + Math.abs(amount - i).toFixed(decimalPlaces).slice(2) : '')
	}

	transactionFormatter(tx) {
		let tbl = [
			['Height', tx.blockHeight],
			['Hash', tx.hash],
			['Amount', `${this.prettyAmounts(tx.totalAmount())} ${this.config.coinConfig.ticker}`],
			['Fee', `${this.prettyAmounts(tx.fee)} ${this.config.coinConfig.ticker}`],
			['Timestamp', `${tx.timestamp} (${new Date(tx.timestamp * 1000).toLocaleString()})`],
			['Coinbase Transaction', tx.isCoinbaseTransaction ? 'yes' : 'no']
		]

		if (tx.paymentID) tbl.push(['Payment ID', tx.paymentID])

		console.log(table(tbl))
	}

	getAddress() {
		console.log(chalk.cyan(`Wallet address: ${this.walletAddress}`))
	}

	sendBasicTransaction(address, amount, paymentID) {
		if (!address) return console.log(chalk.red(`No address given!`))
		if (!amount) return console.log(chalk.red('No amount given!'))

		amount = parseInt(amount, 10) * (10 ** this.config.coinConfig.decimalPlaces)

		if (paymentID) console.log(chalk.magenta(`Set payment ID to ${paymentID}!`))

		console.log(address, amount, paymentID)

		this.wallet.sendTransactionBasic(address, amount, paymentID).then((returnVal) => {
			const [hash, err] = returnVal

			if (err) {
				console.log(chalk.redBright(err))
			} else {
				console.log(chalk.green(`Transaction has been sent! Hash: ${hash}`))
			}
		})
	}

	setLogLevel(lvl) {
		switch (lvl.toLowerCase()) {
			case 'debug':
				this.wallet.setLogLevel(LogLevel.DEBUG)
				break;
			case 'info':
				this.wallet.setLogLevel(LogLevel.INFO)
				break;
			case 'err':
			case 'error':
				this.wallet.setLogLevel(LogLevel.ERROR)
				break;
			case 'trace':
				this.wallet.setLogLevel(LogLevel.TRACE)
				break;
			case 'warning':
			case 'warn':
				this.wallet.setLogLevel(LogLevel.WARNING)
				break;
			default:
				break;
		}
	}

	syncTimer() {
		this.syncStatus = this.wallet.getSyncStatus()
	}
}
