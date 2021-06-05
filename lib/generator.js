
const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const remove = require("../lib/remove")
const fs = require("fs")
const path = require("path");
const _ = require('lodash');
/*
 context = 
 { 
  name: 'hello-cli',
  root: 'hello-cli',
  downloadTemp: 'hello-cli/.download-temp',
  metadata: { 
   projectName: 'hello-cli',
   projectVersion: '1.0.0',
   projectDescription: 'A project named hello-cli' 
  } 
 }
*/
module.exports = function (context) {
  let metadata = context.metadata;
  let src = context.downloadTemp;
  let dest = './' + context.root;
  if (!src) {
    return Promise.reject(new Error(`无效的source：${src}`))
  }
  return new Promise((resolve, reject) => {
    const metalsmith = Metalsmith(process.cwd())  // 返回当前的目录
      .metadata(metadata) // metadata 为用户输入的内容
      .clean(false)
      .source(src)  // 模板文件 path
      .destination(dest);  // 最终编译好的文件存放位置
    // 判断下载的项目模板中是否有templates.ignore
    const ignoreFile = path.resolve(process.cwd(), path.join(src, 'templates.ignore'));
    let package_temp_content;
    if (fs.existsSync(ignoreFile)) {
      // 定义一个用于移除模板中被忽略文件的metalsmith插件
      metalsmith.use((files, metalsmith, done) => {
        const meta = metalsmith.metadata();
        // 先对ignore文件进行渲染，然后按行切割ignore文件的内容，拿到被忽略清单
        const ignores = Handlebars
          .compile(fs.readFileSync(ignoreFile).toString())(meta)
          .split('\n').map(s => s.trim().replace(/\//g, "\\")).filter(item => item.length);
        //删除被忽略的文件
        for (let ignorePattern of ignores) {
          if (files.hasOwnProperty(ignorePattern)) {
            delete files[ignorePattern];
          }
        }
        done()
      })
    }
    metalsmith.use((files, metalsmith, done) => {
      const meta = metalsmith.metadata()
      Object.keys(files).forEach(fileName => {  // 遍历替换模板
        if (!_.startsWith(fileName, 'src/font') || !_.startsWith(fileName, 'src/images')) { //判断是否为字体文件，字体或图片文件不用替换
          const t = files[fileName].contents.toString() // Handlebar compile 前需要转换为字符串
          // files[fileName].contents = new Buffer(Handlebars.compile(t)(meta));
        }
      })
      done()
    }).build(err => {
      remove(src);  //删除下载下来的模板文件，比如项目中的 'hello-cli/.download-temp'这个路径删除掉
      err ? reject(err) : resolve(context);
    })
  });
};