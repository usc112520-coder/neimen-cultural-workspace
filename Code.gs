const CONSOLE_PASSWORD_SALT='CONFIGURE_CONSOLE_SALT';
const CONSOLE_PASSWORD_HASH='CONFIGURE_CONSOLE_HASH';
function unlockConsole(password){if(typeof password!=='string'||password.length>200)throw Error('密碼不正確');const actual=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,CONSOLE_PASSWORD_SALT+password,Utilities.Charset.UTF_8).map(n=>('0'+((n+256)%256).toString(16)).slice(-2)).join('');if(actual!==CONSOLE_PASSWORD_HASH)throw Error('密碼不正確');const token=Utilities.getUuid();CacheService.getScriptCache().put('console:'+token,'1',1800);return token;}
function requireConsole_(token){if(typeof token!=='string'||!CacheService.getScriptCache().get('console:'+token))throw Error('控制台驗證已失效，請重新輸入密碼');}
const ROOT_ID='CONFIGURE_DRIVE_FOLDER_0';
const INDEX_NAME='_neimen_material_index_v1.json';
const FOLDERS={
 'CONFIGURE_DRIVE_FOLDER_1':['捷可 (剪輯/文案統籌)','短影音'],
 'CONFIGURE_DRIVE_FOLDER_2':['盈萱 (形象角色/錄製)','導覽圖文'],
 'CONFIGURE_DRIVE_FOLDER_3':['奕婷 (宣傳圖卡製作)','宣傳圖卡'],
 'CONFIGURE_DRIVE_FOLDER_4':['捷可 (剪輯/文案統籌)','採訪文字'],
 'CONFIGURE_DRIVE_FOLDER_5':['盈萱 (形象角色/錄製)','導覽圖文']
};
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('內門文化地圖｜公開共編工作區');}
// Names ending in _ cannot be called through google.script.run.
function withLock_(action){const lock=LockService.getScriptLock();lock.waitLock(30000);try{return action();}finally{lock.releaseLock();}}
function workspaceFile_(name,key,initial){
 const properties=PropertiesService.getScriptProperties(),id=properties.getProperty(key);
 if(id){try{const file=DriveApp.getFileById(id);if(file.isTrashed())throw Error('檔案在垃圾桶');return file;}catch(e){throw Error('無法存取共用設定檔 '+name+'，請確認此帳戶對工作區及設定檔有權限；不會另建私人副本。');}}
 const root=DriveApp.getFolderById(ROOT_ID),it=root.getFilesByName(name);let file=null;
 if(it.hasNext()){file=it.next();if(it.hasNext())throw Error('共用設定檔重複：'+name+'，請先整理');}
 if(!file&&initial!==undefined)file=root.createFile(name,JSON.stringify(initial),MimeType.PLAIN_TEXT);
 if(file)properties.setProperty(key,file.getId());return file;
}
function indexFile_(){return workspaceFile_(INDEX_NAME,'MATERIAL_INDEX_ID',{revision:0,materials:[]});}
function readIndex_(file){const data=JSON.parse(file.getBlob().getDataAsString('UTF-8'));if(!Number.isInteger(data.revision)||!Array.isArray(data.materials))throw Error('雲端索引格式不正確');return data;}
function validate_(items){
 if(!Array.isArray(items)||items.length>10000)throw Error('索引最多 10,000 筆');
 const ids={}; const statuses=['已採集未整理','內文撰寫中','影音剪輯中','已發布'];
 return items.map(m=>{if(!m||typeof m.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(m.id)||ids[m.id])throw Error('編號格式不正確或重複');ids[m.id]=true;
 if(typeof m.title!=='string'||!m.title.trim()||typeof m.status!=='string'||!m.status.trim()||m.status.trim().length>80||['ALL','__custom__'].indexOf(m.status.trim())>=0)throw Error('標題或狀態不正確');
 const n={};['id','title','member','theme','location','status','type','image','driveLink','desc','note','createdAt'].forEach(k=>{if(m[k]!=null&&typeof m[k]!=='string')throw Error('欄位必須為文字');n[k]=(m[k]||'').slice(0,50000);});
 ['image','driveLink'].forEach(k=>{if(n[k]&&!/^https?:\/\//i.test(n[k]))throw Error('連結必須是 http 或 https');});return n;});
}
function commit_(file,data){const text=JSON.stringify(data);if(Utilities.newBlob(text).getBytes().length>8*1024*1024)throw Error('索引超過 8 MB');file.setContent(text);return data;}
function readWorkspace(){return withLock_(()=>readIndex_(indexFile_()));}
function writeWorkspace(items,expectedRevision,consoleToken){return withLock_(()=>{const file=indexFile_(),data=readIndex_(file);if(data.revision!==expectedRevision)throw Error('雲端版本已更新；請匯出本機備份，再載入雲端版本');const next=validate_(items);for(const report of next){const old=data.materials.find(m=>m.id===report.id);if((!old||Object.keys(report).some(k=>report[k]!==(old[k]||'')))&&(!report.member.trim()||report.member.trim().length>100||report.member.trim()==='__custom__'))throw Error('請指定角色／負責成員後再儲存進度報告');}if(next.some(m=>{const previous=data.materials.find(p=>p.id===m.id);return m.note!==(previous?previous.note||'':'');}))requireConsole_(consoleToken);return commit_(file,{revision:data.revision+1,materials:next});});}
function listWorkspaceFolders(){
 
 const children=DriveApp.getFolderById(ROOT_ID).getFolders(),result=[];
 while(children.hasNext()){const folder=children.next();result.push({id:folder.getId(),name:folder.getName()});}
 return result.sort((a,b)=>a.name.localeCompare(b.name,'zh-TW'));
}
function listWorkspaceFiles(folderId){
 
 workspacePath_(folderId);
 const it=DriveApp.getFolderById(folderId).getFiles(),files=[];
 while(it.hasNext()){const f=it.next();files.push({id:f.getId(),name:f.getName(),url:f.getUrl()});}
 return files.sort((a,b)=>a.name.localeCompare(b.name,'zh-TW'));
}

// Verify membership by walking parents, never by trusting a client supplied path.
function workspacePath_(folderId){
 if(typeof folderId!=='string'||!folderId)throw Error('資料夾位置不正確');
 const queue=[{id:folderId,tail:[]}],seen=new Set();
 for(let i=0;i<queue.length;i++){
  const node=queue[i];if(seen.has(node.id))continue;seen.add(node.id);
  const folder=DriveApp.getFolderById(node.id),path=[{id:folder.getId(),name:folder.getName()}].concat(node.tail);
  if(node.id===ROOT_ID)return path;
  const parents=folder.getParents();while(parents.hasNext())queue.push({id:parents.next().getId(),tail:path});
 }
 throw Error('此資料夾不在指定工作區內，或沒有存取權限');
}
function browseWorkspaceFolder(folderId){
 
 const path=workspacePath_(folderId),folder=DriveApp.getFolderById(folderId),folders=[],files=[];
 const children=folder.getFolders();while(children.hasNext()){const f=children.next();folders.push({id:f.getId(),name:f.getName()});}
 const items=folder.getFiles();while(items.hasNext()){const f=items.next();files.push({id:f.getId(),name:f.getName(),url:f.getUrl()});}
 const sort=(a,b)=>a.name.localeCompare(b.name,'zh-TW');
 return {id:folderId,name:folder.getName(),path,folders:folders.sort(sort),files:files.sort(sort)};
}

const GUIDES_NAME='_neimen_workspace_guides_v1.json';
function guideFile_(){return workspaceFile_(GUIDES_NAME,'GUIDE_SETTINGS_ID');}
function readGuides_(file){if(!file)return {revision:0,guides:{}};const data=JSON.parse(file.getBlob().getDataAsString('UTF-8'));if(!Number.isInteger(data.revision)||!data.guides)throw Error('文字設定格式不正確');return data;}
function readGuideSettings(){return withLock_(()=>readGuides_(guideFile_()));}
function writeGuideSettings(guides,expectedRevision,consoleToken){requireConsole_(consoleToken);return withLock_(()=>{if(!guides||typeof guides.asset!=='string'||typeof guides.workflow!=='string'||guides.asset.length>20000||guides.workflow.length>20000)throw Error('每段文字最多 20,000 字');let file=guideFile_();const before=readGuides_(file);if(before.revision!==expectedRevision)throw Error('雲端文字版本已更新，請複製保留草稿後重新載入');const result={revision:before.revision+1,guides:{asset:guides.asset,workflow:guides.workflow}};const text=JSON.stringify(result);if(file)file.setContent(text);else workspaceFile_(GUIDES_NAME,'GUIDE_SETTINGS_ID',result);return result;});}

function validateCatalog_(data){
 if(!data||!Array.isArray(data.themes)||!Array.isArray(data.spots)||data.themes.length>100||data.spots.length>300)throw Error('最多 100 個主題、300 個據點');
 const ids=new Set(),names={themes:new Set(),spots:new Set()};
 const clean=(row,kind)=>{if(!row||typeof row.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(row.id)||ids.has(row.id))throw Error('編號不正確或重複');ids.add(row.id);if(typeof row.name!=='string'||!row.name.trim()||row.name.trim().length>80)throw Error('名稱須為 1～80 字');const aliases=[...new Set([row.name.trim(),...(Array.isArray(row.aliases)?row.aliases:[])])];for(const name of aliases){if(typeof name!=='string'||!name.trim()||name.length>80||names[kind].has(name))throw Error('名稱或舊名稱重複，請使用不同名稱');names[kind].add(name);}return{id:row.id,name:row.name.trim(),aliases:aliases.filter(n=>n!==row.name.trim())};};
 const themes=data.themes.map(r=>clean(r,'themes')),themeIds=new Set(themes.map(t=>t.id));
 const spots=data.spots.map(r=>{const n=clean(r,'spots');if(!themeIds.has(r.themeId))throw Error('每個據點都必須指定有效主題');if(typeof r.desc!=='string'||r.desc.length>2000)throw Error('據點說明最多 2,000 字');return {...n,themeId:r.themeId,desc:r.desc};});return{themes,spots};
}

const CATALOG_NAME='_neimen_cultural_catalog_v1.json';
function catalogFile_(){return workspaceFile_(CATALOG_NAME,'CATALOG_SETTINGS_ID');}
function readCatalog_(file){if(!file)return {revision:0,catalog:null};const data=JSON.parse(file.getBlob().getDataAsString('UTF-8'));if(!Number.isInteger(data.revision))throw Error('據點設定版本不正確');return {revision:data.revision,catalog:validateCatalog_(data.catalog)};}
function readCatalogSettings(){return withLock_(()=>readCatalog_(catalogFile_()));}
function writeCatalogSettings(catalog,expectedRevision,consoleToken){requireConsole_(consoleToken);return withLock_(()=>{const next=validateCatalog_(catalog);const file=catalogFile_(),before=readCatalog_(file);if(before.revision!==expectedRevision)throw Error('雲端據點版本已更新，請先複製保留草稿，再重新開啟頁面合併');const result={revision:before.revision+1,catalog:next},text=JSON.stringify(result);if(file)file.setContent(text);else workspaceFile_(CATALOG_NAME,'CATALOG_SETTINGS_ID',result);return result;});}

function readApplicationState(){return withLock_(()=>({workspace:readIndex_(indexFile_()),catalog:readCatalog_(catalogFile_()),guides:readGuides_(guideFile_())}));}

// Only files explicitly referenced by a saved report can supply public previews.
function readReportThumbnail(reportId){
 const report=readWorkspace().materials.find(m=>m.id===reportId);
 if(!report||report.image||!report.driveLink)return null;
 const link=report.driveLink,match=reportFileId_(link);
 if(!match)return null;
 try{
  const file=DriveApp.getFileById(match[1]);if(file.isTrashed())return null;
  const parents=file.getParents();let inside=false;while(parents.hasNext()){try{workspacePath_(parents.next().getId());inside=true;break;}catch(e){}}
  if(!inside)return null;
  const thumbnail=file.getThumbnail();if(!thumbnail)return null;
  const mime=thumbnail.getContentType(),bytes=thumbnail.getBytes();
  if(!/^image\/(png|jpeg|gif|webp)$/.test(mime)||bytes.length>1024*1024)return null;
  return {driveLink:link,image:'data:'+mime+';base64,'+Utilities.base64Encode(bytes)};
 }catch(e){return null;}
}

function readReportLocation(reportId){
 const report=readWorkspace().materials.find(m=>m.id===reportId);if(!report||!report.driveLink)return null;
 const link=report.driveLink;
 try{
  const folderMatch=link.match(/^https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
  if(folderMatch)return {path:workspacePath_(folderMatch[1]),fileName:''};
  const match=reportFileId_(link);
  if(!match)return null;
  const file=DriveApp.getFileById(match[1]);if(file.isTrashed())return null;
  const parents=file.getParents();while(parents.hasNext()){try{return{path:workspacePath_(parents.next().getId()),fileName:file.getName()};}catch(e){}}
 }catch(e){}return null;
}

// Drive can return Office files with Docs/Sheets/Slides editor URLs.
function reportFileId_(link){
 if(typeof link!=='string')return null;
 return link.match(/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)(?:[/?#]|$)/)
  ||link.match(/^https:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation|drawings|forms)\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)(?:[/?#]|$)/)
  ||(/^https:\/\/drive\.google\.com\/(?:open|uc)\?/.test(link)?link.match(/[?&]id=([A-Za-z0-9_-]+)(?:[&#]|$)/):null);
}

function discussionFile_(){return workspaceFile_('_neimen_report_discussion_v1.json','REPORT_DISCUSSION_ID',{threads:{}});}
function requireReport_(id){if(typeof id!=='string'||!readIndex_(indexFile_()).materials.some(m=>m.id===id))throw Error('此報告已不存在，請重新整理');}
function readReportDiscussion(id){return withLock_(()=>{requireReport_(id);const data=JSON.parse(discussionFile_().getBlob().getDataAsString('UTF-8'));return data.threads[id]||{comments:[],reactions:[]};});}
function writeReportDiscussion(id,member,kind,value){return withLock_(()=>{
 requireReport_(id);if(typeof member!=='string'||!member.trim()||member.trim().length>100||member==='__custom__')throw Error('請指定回應成員');member=member.trim();
 const file=discussionFile_(),data=JSON.parse(file.getBlob().getDataAsString('UTF-8')),thread=data.threads[id]||{comments:[],reactions:[]};
 if(kind==='comment'){if(typeof value!=='string'||!value.trim()||value.length>2000)throw Error('留言須為 1～2,000 字');if(thread.comments.length>=500)throw Error('此報告留言已達上限');thread.comments.push({id:Utilities.getUuid(),member,text:value.trim(),createdAt:new Date().toISOString()});}
 else if(kind==='reaction'){if(['👍','❤️','🎉','👏','💡'].indexOf(value)<0)throw Error('表情格式不正確');const index=thread.reactions.findIndex(r=>r.member===member&&r.emoji===value);if(index>=0)thread.reactions.splice(index,1);else{if(thread.reactions.length>=2000)throw Error('此報告表情已達上限');thread.reactions.push({member,emoji:value});}}
 else throw Error('回應格式不正確');data.threads[id]=thread;commit_(file,data);return thread;
});}
