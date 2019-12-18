let wallet

ipcRenderer.on('logger', (event, arg) => {
	// Logger output
	document.getElementById("log").innerHTML = document.getElementById("log").innerHTML + "<br />" + arg;
});

ipcRenderer.on('updatesync', (event, arg) => {
	// Logger output
	document.getElementById("sync").innerHTML = arg[0] + "/" + arg[2];
});

ipcRenderer.once('addrs', (event, arg) => {
	// Logger output
	document.getElementById("walletaddr").innerHTML = document.getElementById("walletaddr").innerHTML + "<br />" + arg;
});

ipcRenderer.once('close', (event, arg) => {
	// Logger output
	remote.getCurrentWindow().close()
});

ipcRenderer.on('balance', (event, arg) => {
	// Logger output
	document.getElementById("balance").innerHTML = arg[0] + arg[1];
});

ipcRenderer.on('openwallet-reply', (event, success) => {
	if(success) {
		show('walletopen','walletclosed');
		setInterval(updatesync, 2000)
	}
});

function show(shown, hidden) {
	document.getElementById(shown).style.display = 'block';
	document.getElementById(hidden).style.display = 'none';
	return false;
}

/*function openWallet(walletFile, walletPassword) {
	document.getElementById("notlog").style.display = 'block';
	wallet = new Wallet(false, walletFile, walletPassword, backendconf.nodes, backendconf)
}*/

function openWallet(walletFile, walletPassword) {
	var data = [];
	data.push(0);
	data.push(walletFile);
	data.push(walletPassword);
	ipcRenderer.send('openwallet', data);
}

function walletAddrs() {
	var p = document.createElement("p");
	document.body.appendChild(p);
	var node = document.createTextNode(wallet.walletAddress);
	p.appendChild(node);
}

function testFunc(msg) {
	ipcRenderer.send('channel', msg);
}

function updatesync() {
	ipcRenderer.send('updatesync', '')
}
