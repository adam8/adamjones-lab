import { spawn } from 'node:child_process';
import net from 'node:net';

const host = '127.0.0.1';
const probe = net.createServer();

probe.listen(0, host, () => {
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : null;

  probe.close(() => {
    if (!port) {
      process.stderr.write('Unable to reserve a port for Playwright.\n');
      process.exitCode = 1;
      return;
    }

    const playwright = spawn(
      process.execPath,
      ['./node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
      {
        env: { ...process.env, PLAYWRIGHT_PORT: String(port) },
        stdio: 'inherit',
      },
    );

    playwright.on('error', (error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
    playwright.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      process.exitCode = code ?? 1;
    });
  });
});

probe.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
