const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Clean vector contours derived from the four user-supplied lightning and flame symbols.
// Render at 1024px, downsample with Lanczos: no stretching, clipping, or blurry thumbnails.
const blackBolt = 'M591,196 L576,196 L570,202 L310,561 L313,576 L323,582 L482,584 L486,587 L415,810 L420,824 L429,829 L442,828 L456,812 L713,457 L709,445 L700,440 L532,437 L602,218 L602,207Z';
const whiteBolt = 'M580,194 L385,457 L418,440 L311,619 L473,548 L485,546 L491,555 L493,563 L396,829 L485,733 L457,745 L453,743 L712,345 L535,451 L531,449 L563,406 L496,442 L479,447 L496,396Z';
const goldenBolt = [
'M645,820 L640,817 L622,827 L631,829 L644,824Z',
'M473,722 L470,731 L486,754 L478,726Z',
'M662,646 L626,706 L628,712 L647,720 L651,727 L595,801 L614,786 L685,719 L662,702 L658,696Z',
'M339,622 L400,685 L416,801 L493,826 L488,815 L443,753 L439,661Z',
'M436,195 L433,200 L532,508 L538,508 L577,460 L582,462 L580,587 L574,589 L501,558 L495,560 L531,792 L535,801 L559,642 L561,640 L580,641 L599,647 L601,643 L648,335 L640,336 L569,398 L566,394 L565,246Z',
'M505,566 L512,570 L520,649 L519,672 L501,571Z',
'M444,205 L452,207 L459,217 L509,398 L515,432 L510,425 L443,214Z'
];
const ghost = 'M765,208 L725,275 L693,309 L647,341 L596,362 L546,370 L490,363 L502,292 L553,205 L481,217 L425,237 L357,276 L294,333 L225,439 L203,505 L194,567 L198,618 L215,674 L278,760 L314,785 L384,812 L503,812 L625,770 L683,730 L732,683 L797,579 L826,468 L818,331Z';
const ghostEyes = ['M247,585 L328,659 L316,674 L282,679 L258,659 L244,623Z','M517,563 L522,599 L515,626 L476,674 L445,688 L413,690 L358,664Z'];
const svg = (inner, bg) => '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'+(bg?'<rect width="1024" height="1024" fill="'+bg+'"/>':'')+inner+'</svg>';
const glow = '<defs><filter id="g" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="10"/></filter><linearGradient id="gold" x1="0" x2="0.7" y1="0" y2="1"><stop stop-color="#FFF32D"/><stop offset="0.55" stop-color="#FFC524"/><stop offset="1" stop-color="#F3970A"/></linearGradient></defs>';
const whiteLightning = glow + '<path d="'+whiteBolt+'" fill="#FFFFFF" opacity=".46" filter="url(#g)"/><path d="'+whiteBolt+'" fill="#FFFFFF"/>';
const goldPaths = goldenBolt.map(d=>'<path d="'+d+'" fill="url(#gold)" stroke="#FFE94C" stroke-width="3" stroke-linejoin="round"/>').join('');
const icons = {
  'black-bolt': svg('<path d="'+blackBolt+'" fill="#111111"/>','#FAFAFA'),
  'white-bolt': svg(whiteLightning,'#111111'),
  'golden-bolt': svg(glow+goldPaths,'#FBFBFB'),
  'ghost-flame': svg('<path d="'+ghost+'" fill="#FFFFFF"/>'+ghostEyes.map(d=>'<path d="'+d+'" fill="#101010"/>').join(''),'#101010')
};
const root=path.join(__dirname,'..','assets');
const out=path.join(root,'mascots');
fs.mkdirSync(out,{recursive:true});
async function main(){
  for(const [key,source] of Object.entries(icons)){
    await sharp(Buffer.from(source)).resize(1024,1024).png({compressionLevel:9}).toFile(path.join(out,key+'.png'));
    console.log('Generated high-resolution icon:',key);
  }
  // Native splash: dark full screen, crisp white bolt centered (no artificial delay).
  const splash=svg(whiteLightning,null);
  await sharp(Buffer.from(splash)).resize(1024,1024).png({compressionLevel:9}).toFile(path.join(root,'ascend-splash.png'));
  console.log('Generated native Ascend lightning splash');
}
main().catch(e=>{console.error(e);process.exitCode=1});
