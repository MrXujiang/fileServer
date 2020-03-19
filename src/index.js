import koa from 'koa';
import server from 'koa-static';
import { resolve } from 'path';
import glob from 'glob';
import config from './config';
import cors from 'koa2-cors';
import Router from '@koa/router'
import { uploadSingleCatchError, delFile } from './lib/upload';
 
const router = new Router()
const staticPath = resolve(__dirname, '../public')
// 启动逻辑
async function start() {
    const app = new koa();

    // 设置静态目录
    app.use(server(staticPath))

    // 设置跨域
    app.use(cors({
        origin: function (ctx) {
            console.log(111, ctx.url)
            if (ctx.url.indexOf('/api/v0') > -1) {
                return "*"; // 允许来自所有域名请求
            }
            return 'http://localhost:8080'; // 这样就能只允许 http://localhost:8080 这个域名的请求了
        },
        exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
        maxAge: 5,  //  该字段可选，用来指定本次预检请求的有效期，单位为秒
        credentials: true,
        allowMethods: ['GET', 'POST', 'DELETE'],
        allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-requested-with'],
    }))

    // 上传文件
    router.post('/api/v0/upload', uploadSingleCatchError,
        ctx => {
            let { filename, path, size } = ctx.file;
            let { source } = ctx.request.body || 'unknow';
    
            let url = `${config.staticPath}${path.split('/public')[1]}`
            
            ctx.body = {
                state: 200,
                filename,
                url,
                source,
                size
            }
        }
      );

      // 读取文件
      router.get('/api/v0/files',
        ctx => {
            const files = glob.sync(`${staticPath}/uploads/*`)
            const result = files.map(item => {
                return `${config.staticPath}${item.split('public')[1]}`
            })
            console.log(result)

            
            ctx.body = {
                state: 200,
                result
            }
        }
      );

      // 删除文件
      router.get('/api/v0/del',
        async ctx => {
            const { id } = ctx.query
            if(id) {
                const err = await delFile(`${staticPath}/uploads/${id}`)
                if(!err) {
                    ctx.body = {
                        state: 200,
                        result: '删除成功'
                    }
                }else {
                    ctx.code = 500
                    ctx.body = {
                        state: 500,
                        result: '文件不存在，删除失败'
                    }
                } 
            }else {
                ctx.code = 500
                ctx.body = {
                    state: 500,
                    result: 'id不能为空'
                }
            }  
        }
      )
      
    app.use(router.routes()).use(router.allowedMethods())

    app.listen(config.serverPort, () => {
        console.log(`服务器地址:${config.protocol}//${config.host}:${config.serverPort}`)
    });
}

start()