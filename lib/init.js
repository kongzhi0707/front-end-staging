#!/usr/bin/env node

const program = require('commander');

const path = require('path');
const fs = require('fs');
const glob = require('glob');
const inquirer = require('inquirer');

const generator = require('../lib/generator')
const logSymbols = require("log-symbols");
const chalk = require('chalk');

const download = require('../lib/download');

program.usage('<project-name>').parse(process.argv);;

let next = undefined;

// 根据输入，获取项目名称
let projectName = program.args[1];

// project-name 是必填项
if (!projectName) { 
  // 如果没有，相当于执行命令的 --help选项。显示help信息
  program.help();
  return;
}

// 遍历当前的目录
const list = glob.sync('*');
let rootName = path.basename(process.cwd());

if (list.length) { // 如果当前目录不为空
  if (list.some(name => {
    const fileName = path.resolve(process.cwd(), name);
    const isDir = fs.statSync(fileName).isDirectory();
    return projectName === name && isDir;
  })) {
    console.log(`项目${projectName}已经存在`);
    return;
  }
  // 如果目录中不存在与project-name同名的目录，则创建以project-name作为名称的目录作为工程的根目录
  rootName = projectName;
  next = Promise.resolve(projectName);
} else if (rootName === projectName) {
  // 当前目录为空，如果当前目录的名称和project-name是一样的。则直接在当前目录下创建工程，
  rootName = '.';
  next = inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
      type: 'confirm',
      default: true
    }
  ]).then(answer => {
    return  Promise.resolve(answer.buildInCurrent ? '.' : projectName);
  })
} else {
  // 当前目录为空，如果当前目录的名称和project-name不是一样的，在当前目录下创建以project-name作为名称的目录作为工程的根目录。
  rootName = projectName;
  next = Promise.resolve(projectName);
}

next && goFunc();

function goFunc() {
  /*
  // 遗留，处理子命令
  console.log(path.resolve(process.cwd(), path.join('.', rootName)));
  // 下面是新增的代码
  download(rootName)
    .then(target => {console.log(target)})
    .catch(err => console.log(err));
  */
  next.then(projectRoot => {
    if (projectRoot !== '.') {
      fs.mkdirSync(projectRoot);
    }
    return download(projectRoot).then(target => {
      return {
        name: projectRoot,
        root: projectRoot,
        downloadTemp: target
      }
    });
  }).then(context => {
    console.log('-----', context);
    return inquirer.prompt([
      {
        name: 'projectName',
        message: '项目名称',
        default: context.name
      },
      {
        name: 'projectVersion',
        message: '项目版本号',
        default: '1.0.0'
      }, 
      {
        name: 'projectDescription',
        message: '项目简介',
        default: `A project named ${context.name}`
      }
    ]).then(answer => {
      return {
        ...context,
        metadata: {
          ...answer
        }
      }
    })
  })
  .then(context => {
    //删除临时文件夹，将文件移动到目标目录下
    return generator(context);
  })
  .then(context => {
    console.log(context);
    // 成功用绿色显示，给出积极的反馈
    console.log(logSymbols.success, chalk.green('创建成功:)'));
    console.log(chalk.green('cd ' + context.root + '\nnpm install\nnpm run dev'))
  })
  .catch(err => {
    // 失败了用红色，增强提示
    console.log(err);
    console.error(logSymbols.error, chalk.red(`创建失败：${err.message}`))
  });
}

