let wallet

ipcRenderer.once('asynchronous-reply', (event, arg) => {
	console.log(arg) // prints "pong"
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
	document.getElementById("notlog").style.display = 'block';
	var msg = "true-"+`${walletFile}${backendconf.walletExtension}`+"-walletPassword";
	ipcRenderer.send('asynchronous-message', msg);
}

function walletAddrs() {
	var p = document.createElement("p");
	document.body.appendChild(p);
	var node = document.createTextNode(wallet.walletAddress);
	p.appendChild(node);
}

function testFunc(msg) {
	ipcRenderer.send('asynchronous-message', msg);
}
