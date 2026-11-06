const fs=require('fs');
const path=require('path');
const sharp=require('sharp');
// Original mascot icon assets for Ascend, inspired by cute rounded icon styling.
// Chef mascot deliberately excluded. All five remain optional launcher icons.
const out=path.join(__dirname,'..','assets','mascots');
fs.mkdirSync(out,{recursive:true});
const icons={
 cat:{from:'#EAC7FF',to:'#9962F7',art:`
 <path fill="#111019" d="M145 204 Q149 153 181 96 Q187 85 197 110 L220 158 Q258 140 298 157 L320 111 Q328 87 342 109 Q371 159 375 211 Q397 276 360 342 Q326 390 255 391 Q185 391 149 343 Q111 282 145 204Z"/>
 <ellipse cx="210" cy="265" rx="23" ry="37" fill="#FFFDFB"/><ellipse cx="306" cy="265" rx="23" ry="37" fill="#FFFDFB"/>
 <path d="M155 340Q256 417 359 340" stroke="#453057" stroke-width="10" fill="none" opacity=".35"/>`},
 ghost:{from:'#FFAAE7',to:'#F32EC3',art:`
 <path fill="#FFF4FF" d="M143 203 Q139 144 197 122 L218 88 Q225 74 241 95 L264 118 L293 86 Q307 75 319 110 L334 141 Q379 156 384 211 L379 339 L349 362 L338 388 L312 362 L202 363 L171 386 L164 358 L139 342Z"/>
 <path fill="#E658CE" d="M178 238 Q213 250 241 231 Q243 271 218 290 Q186 302 178 269Z"/>
 <path fill="#E658CE" d="M274 231 Q308 250 339 234 Q341 273 317 288 Q283 300 275 267Z"/>
 <path d="M199 322Q254 347 310 322" stroke="#FBD4FA" stroke-width="7" opacity=".65" fill="none"/>`},
 bunny:{from:'#BA9BFF',to:'#5633D6',art:`
 <path fill="#16101E" d="M164 197 Q146 113 95 99 Q74 90 66 118 Q61 158 111 194 Q68 178 55 206 Q48 230 114 250 Q137 268 174 278 Q141 322 164 360 Q187 393 273 391 L347 389 Q409 366 407 313 Q406 255 369 223 Q338 195 296 186 Q255 130 181 124Z"/>
 <path fill="#251635" d="M192 151 Q251 175 294 185 Q239 103 177 98Z"/>
 <ellipse cx="321" cy="296" rx="30" ry="35" fill="#FFFDFB"/>`},
 doodle:{from:'#CE9BF7',to:'#8745EE',art:`
 <path d="M151 184L187 103Q194 91 206 106L245 151Q265 144 284 157L336 117Q347 107 353 126L378 196L379 306Q378 342 345 358L264 390Q250 395 237 390L156 353Q136 343 132 315L134 217Z" fill="#FFF8FF" stroke="#110D19" stroke-width="19" stroke-linejoin="round"/>
 <ellipse cx="178" cy="281" rx="19" ry="29" fill="#0D0915"/><ellipse cx="274" cy="299" rx="29" ry="39" fill="#0D0915"/>
 <path d="M202 319L214 330L221 317L237 330L247 315" stroke="#0D0915" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`},
 flame:{from:'#FF56B5',to:'#EF175B',art:`
 <path d="M152 374 Q113 352 124 296 L146 202Q153 186 167 195L210 237L232 122Q238 99 255 116L290 182L320 141Q333 126 342 152L391 271Q406 321 374 353 Q337 390 251 391Q181 394 152 374Z" fill="#FFF7FE"/>
 <path d="M203 270Q220 290 203 306Q185 321 207 339Q229 352 239 328Q247 310 232 294Z" fill="#ED1971"/>
 <path d="M304 265Q288 286 303 299Q325 316 305 337Q288 349 276 325Q268 307 286 288Z" fill="#ED1971"/>`}
};
const base=(p)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient><radialGradient id="halo" cx=".32" cy=".12" r="1"><stop stop-color="#FFFFFF" stop-opacity=".42"/><stop offset=".85" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs><rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#halo)"/>${p.art}</svg>`;
async function main(){for(const [name,icon] of Object.entries(icons)){await sharp(Buffer.from(base(icon))).png().toFile(path.join(out,name+'.png'));console.log('Generated icon:',name)}}
main().catch(e=>{console.error(e);process.exitCode=1});
