import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const port=process.env.PORT||4173, root=process.cwd();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{try{const path=req.url==='/'?'index.html':req.url.split('?')[0].slice(1);const data=await readFile(join(root,path));res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,()=>console.log(`Skybound Kingdom: http://localhost:${port}`));
