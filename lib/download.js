
const download = require('download-git-repo');
const path = require("path");
const ora = require('ora');

module.exports = function (target) {
  target = path.join(target || '.', '.download-temp');
  return new Promise((resolve, reject) => {
    /*
     这里可以根据具体的模板地址设置下载的url，注意，如果是git，url后面的branch不能忽略
     切记：我们github地址是这样的：git@github.com:tugenhua0707/store-base-template.git#webpackReactDemo
     但是下载要改成：github.com:tugenhua0707/store-base-template#webpackReactDemo
    */
    let url = 'github.com:tugenhua0707/react-staging-template#master';
    const spinner = ora(`正在下载项目模板，源地址：${url}`)
    spinner.start();
    download(url, target, { clone: true }, function(err) {
      if (err) {
        download(url, target, { clone: false }, function (err) {
          if (err) {
            spinner.fail();
            reject(err)
          } else {
            // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
            spinner.succeed();
            resolve(target)
          }
        })
      } else {
        // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
        spinner.succeed();
        resolve(target);
      }
    })
  });
}