# Standalone Roku Remote Launcher

This project includes a **Standalone Launcher** that allows you to run the remote without manually starting a server or opening a terminal.

## How to use
1.  Ensure you have run `npm run build` at least once (to generate the `dist` folder).
2.  Double-click **`Launch-Remote.bat`** in this folder.

## How it works
The script launches a dedicated Google Chrome window in "App Mode" (no tabs/address bar) with specific flags (`--disable-web-security`) that allow the local file to communicate directly with your Roku device on your local network.

This eliminates the need for the Node.js backend proxy.
