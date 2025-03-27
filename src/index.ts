import { Plugin, Logger } from '@ale-run/runtime';
import fs from 'fs';
import path from 'path';
import chalk from 'ansi-colors';

const logger = Logger.getLogger('plugin:apps');

const find = (directory: string, files?: string[]) => {
  files = files || [];
  const lsfiles = fs.readdirSync(directory);
  for (const file of lsfiles) {
    const absolute = path.resolve(directory, file);
    if (fs.statSync(absolute).isDirectory()) {
      find(absolute, files);
    } else {
      files.push(absolute);
    }
  }

  return files;
};

export default class AleApps extends Plugin {
  public async install(): Promise<void> {
    logger.info(chalk.green.bold(`plugin ${this.name} is installed`), this.options);
  }

  public async uninstall(): Promise<void> {
    logger.info(chalk.red.bold(`plugin ${this.name} is uninstalled`));
  }

  public async activate(): Promise<void> {
    logger.info(chalk.blue.bold(`plugin ${this.name} is activate`), this.options);

    const catalog = await this.context.getCatalog();

    // regist apps
    const appdirs = path.join(__dirname, 'apps');
    const appfiles = find(appdirs).filter((filepath) => filepath.endsWith('.app.yaml') || filepath.endsWith('.app.yml'));

    for (const filepath of appfiles) {
      await catalog.regist(path.dirname(filepath));
    }

    // regist presets
    const presetdirs = path.join(__dirname, 'apps');
    const presetfiles = find(presetdirs).filter((filepath) => filepath.endsWith('.preset.yaml') || filepath.endsWith('.preset.yml'));

    for (const filepath of presetfiles) {
      await catalog.registPreset(path.dirname(filepath));
    }
  }

  public async deactivate(): Promise<void> {
    logger.info(chalk.red(`plugin ${this.name} is deactivate`));
  }
}
