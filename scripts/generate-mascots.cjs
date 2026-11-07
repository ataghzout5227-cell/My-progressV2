const fs=require('fs');
const path=require('path');
const sharp=require('sharp');

// User-provided artwork: preserve the supplied images rather than redraw or recolor them.
// Each source is an actual cropped JPG committed under assets/selected-icons.
const names=['sunny-sprite','mono-peek','red-cat','sleepy-cat','night-watcher','ink-emblem','yin-yang'];
const root=path.join(__dirname,'..','assets');
const out=path.join(root,'mascots');
fs.mkdirSync(out,{recursive:true});
async function main(){
 for(const name of names){
  const file=path.join(root,'selected-icons',name+'.jpg');
  if(!fs.existsSync(file))throw new Error('Missing icon source: '+file);
  const metadata=await sharp(file).metadata();
  if(metadata.width!==96||metadata.height!==96)throw new Error('Invalid source icon size: '+name);
  const dest=path.join(out,name+'.png');
  await sharp(file).resize(512,512,{fit:'fill',kernel:'lanczos3'})
    .png({compressionLevel:9}).toFile(dest);
  console.log('Prepared uploaded Ascend icon:',name);
 }
}
main().catch(error=>{console.error(error);process.exitCode=1});
