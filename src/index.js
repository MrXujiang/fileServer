import koa from 'koa';
import server from 'koa-static';
import { resolve } from 'path';
import { createReadStream, readFileSync } from 'fs';
import config from './config';
import cors from 'koa2-cors';
import Router from '@koa/router'
import { uploadSingleCatchError } from './lib/upload';
 
const router = new Router()
// 启动逻辑
async function start() {
    const app = new koa();

    // 设置静态目录
    app.use(server(resolve(__dirname, '../public')))

    // 设置跨域
    app.use(cors({
        origin: function (ctx) {
            console.log(111, ctx.url)
            if (ctx.url.indexOf('/api/v0') > -1) {
                console.log(222)
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

    router.post(
        '/api/v0/upload',
        uploadSingleCatchError,
        ctx => {
            let { filename, path, size } = ctx.file;
            let { source } = ctx.request.body || 'unknow';
    
            let url = `${config.staticPath}${path.split('/public')[1]}`;
            ctx.body = {
                state: 200,
                filename,
                url,
                source,
                size
            }
        }
      );

    // 渲染静态页面
    // app.use(async (ctx, next) => {
    //     if(ctx.url.indexOf('/api/v0/upload') === 0) {
    //         uploadSingleCatchError(ctx, next)
    //         console.log(ctx.url)
    //     }else if(ctx.url.indexOf('/api/v0/getFiles') === 0) {
    //         console.log(ctx.url)
    //     }
    //     await next()
    // })
    app.use(router.routes()).use(router.allowedMethods())

    app.listen('3001', () => {
        console.log(`服务器地址:${config.protocol}//${config.host}:${config.serverPort}`)
    });
}

start()


