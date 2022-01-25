# Bundland

Private bundled module service for Deno.

Deno 私有打包模块服务，适配阿里云FC + OSS

## Curx.land

```
https://crux.land/2E4o6E
```

## Usage

先准备好一个oss，最好是同一个可用区

配置好环境变量：

```
ACCESS_KEY_ID=
ACCESS_KEY_SECRET=
BUCKET_NAME=
# 注意，endpoint使用带bucket名称的域名，可以用https
# 同一个可用区可以用vpc的endpoint
OSS_ENDPOINT=
# 以上为必填参数

# 授权token
# 具体参考: https://deno.land/manual@v1.18.0/linking_to_external_code/private
# 留空或者不设置代表不需要鉴权
TOKEN=
```

创建一个http类型的函数计算，运行环境为custom runtime

自己想办法解决deno二进制文件，然后修改`bootstrap`文件

```shell
#!/bin/bash
/path/to/deno run --allow-net --allow-env https://crux.land/2E4o6E
```

### 发布一个模块

#### POST /modname@tag

Example:

```shell
curl -d 'console.log(123)' http://your.domain/module@tag
```

打包发布：

```shell
deno bundle entry.ts | curl -T - -X POST http://your.domain/module@tag
```

### 获取模块

#### GET /modname[@tag]

默认`tag`是`main`

```shell
curl http://your.domain/module@tag
curl http://your.domain/module
```
