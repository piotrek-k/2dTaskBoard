export class SettingsProvider {
    debugModeEnabled: boolean = false;

    constructor() {
        const debugModeValue = localStorage.getItem("debug");

        if (debugModeValue) {
            this.debugModeEnabled = JSON.parse(debugModeValue) || false;
        }
    }

    public getDebugModeEnabled(): boolean {
        return this.debugModeEnabled;
    }
}

const settingsProvider = new SettingsProvider();

export default settingsProvider;