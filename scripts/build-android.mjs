import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const android = path.join(root, 'android');
const wrapper = path.join(android, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
if (!existsSync(wrapper)) throw new Error('Android project is missing. Run npm run cap:add:android first.');

const env = { ...process.env };
const adoptiumRoot = 'C:\\Program Files\\Eclipse Adoptium';
const jdk21 = existsSync(adoptiumRoot) ? readdirSync(adoptiumRoot).find(name => name.startsWith('jdk-21')) : null;
const studioJdk = 'C:\\Program Files\\Android\\Android Studio\\jbr';
if (jdk21) env.JAVA_HOME = path.join(adoptiumRoot, jdk21);
else if (!env.JAVA_HOME && existsSync(studioJdk)) env.JAVA_HOME = studioJdk;

const command = process.platform === 'win32' ? 'cmd.exe' : wrapper;
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'gradlew.bat assembleDebug'] : ['assembleDebug'];
const result = spawnSync(command, args, { cwd: android, env, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
const apk = path.join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const installCopy = path.join(root, 'SignBySign-Android.apk');
copyFileSync(apk, installCopy);
console.log(`APK: ${installCopy}`);
