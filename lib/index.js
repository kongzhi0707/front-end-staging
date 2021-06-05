#!/usr/bin/env node

const program = require('commander');

// 处理 -v, --version时输出
program
  .version(require('../package').version, '-v, --version')
  .usage('<command> [项目名称]')
  .command('init <name>', '创建新项目');

// 解析输入参数，记得放在最后即可
program.parse(process.argv);