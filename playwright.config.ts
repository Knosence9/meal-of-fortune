import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		launchOptions: {
			executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
		}
	},
	webServer: {
		command: 'pnpm build && pnpm preview --host 127.0.0.1',
		port: 4173,
		reuseExistingServer: !process.env.CI
	}
});
