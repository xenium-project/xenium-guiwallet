// Electron
const electron = require('electron')
const {
	app,
	BrowserWindow
} = require('electron')
const {
	ipcMain
} = require('electron')

// Electron Addons
const Splash = require('@trodi/electron-splashscreen');
//const store = new (require('electron-store')); // Requiren und direkt instanziieren
const contextMenu = require('electron-context-menu');

const Wallet = require("./lib/wallet-backend")
const backendconf = require('./config')



contextMenu({
	prepend: (defaultActions, params, browserWindow) => [{
			label: 'Rainbow',
			// Only show it when right-clicking images
			visible: params.mediaType === 'image'
		},
		{
			label: 'Search Google for “{selection}”',
			// Only show it when right-clicking text
			visible: params.selectionText.trim().length > 0,
			click: () => {
				shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
			}
		}
	]
});

// Behalten Sie eine globale Referenz auf das Fensterobjekt.
// Wenn Sie dies nicht tun, wird das Fenster automatisch geschlossen,
// sobald das Objekt dem JavaScript-Garbagekollektor übergeben wird.

let win, wallet

const config = {
	windowOpts: {
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	},
	templateUrl: `${__dirname}/src/splash-screen.html`,
	splashScreenOpts: {
		width: 275,
		height: 275
	}
};

function openWallet(walletFile, walletPassword) {
	//document.getElementById("notlog").style.display='block';
	wallet = new Wallet(false, walletFile, walletPassword, backendconf.nodes, backendconf)
}

function newWallet(walletFile, walletPassword) {
	//document.getElementById("notlog").style.display='block';
	wallet = new Wallet(true, `${walletFile}${backendconf.walletExtension}`, walletPassword, backendconf.nodes, backendconf)
}

function createWindow() {
	// Erstellen des Browser-Fensters.

	win = Splash.initSplashScreen(config);

	// und lade die index.html der App.
	win.loadFile(__dirname + '/src/index.html')

	// Öffnen der DevTools.
	//win.webContents.openDevTools()

	// Ausgegeben, wenn das Fenster geschlossen wird.
	win.on('closed', () => {
		// Dereferenzieren des Fensterobjekts, normalerweise würden Sie Fenster
		// in einem Array speichern, falls Ihre App mehrere Fenster unterstützt.
		// Das ist der Zeitpunkt, an dem Sie das zugehörige Element löschen sollten.
		win = null
	})
}

// Diese Methode wird aufgerufen, wenn Electron mit der
// Initialisierung fertig ist und Browserfenster erschaffen kann.
// Einige APIs können nur nach dem Auftreten dieses Events genutzt werden.
app.on('ready', createWindow)

// Verlassen, wenn alle Fenster geschlossen sind.
app.on('window-all-closed', () => {
	// Unter macOS ist es üblich, für Apps und ihre Menu Bar
	// aktiv zu bleiben, bis der Nutzer explizit mit Cmd + Q die App beendet.
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// Unter macOS ist es üblich ein neues Fenster der App zu erstellen, wenn
	// das Dock Icon angeklickt wird und keine anderen Fenster offen sind.
	if (win === null) {
		createWindow()
	}
})

// In dieser Datei können Sie den Rest des App-spezifischen
// Hauptprozess-Codes einbinden. Sie können den Code auch
// auf mehrere Dateien aufteilen und diese hier einbinden.

//Handler fur IPC

ipcMain.on('asynchronous-message', (event, arg) => {
	console.log(arg) // prints Message output
	event.reply('asynchronous-reply', 'pong') // responds with 'pong'
})
