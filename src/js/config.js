module.exports = {
	// self explanatory, your application name, descriptions, etc
	appName: 'Xenium Wallet',
	appDescription: 'Xenium Wallet Gui',
	appSlogan: 'Fast and steady wins the race!',
	appId: 'org.xenium.wallet',
	appGitRepo: 'https://github.com/turtlecoin/turtle-wallet-electron',

	daemonDefaultRpcPort: 32779,
	walletFileDefaultExt: '.wllt',
	blockExplorerUrl: '',
	remoteNodeDefaultHost: '',
	remoteNodeListUpdateUrl: '',

	assetName: 'Xenium',
	assetTicker: 'XNU',
	addressPrefix: 'XNU',
	addressLength: 98,
	integratedAddressLength: 3 + ((64 * 11) / 8),

	minimumFee: 0.5,
	mininumSend: 0.5,
	defaultMixin: 2,
	decimalPlaces: 3,
	decimalDivisor: 10 ** 3,
}
