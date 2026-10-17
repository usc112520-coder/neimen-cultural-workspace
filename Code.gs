const ROOT_ID='CONFIGURE_DRIVE_FOLDER_0';
const INDEX_NAME='_neimen_material_index_v1.json';
const FOLDERS={
 'CONFIGURE_DRIVE_FOLDER_1':['捷可 (剪輯/文案統籌)','短影音'],
 'CONFIGURE_DRIVE_FOLDER_2':['盈萱 (形象角色/錄製)','導覽圖文'],
 'CONFIGURE_DRIVE_FOLDER_3':['奕婷 (宣傳圖卡製作)','宣傳圖卡'],
 'CONFIGURE_DRIVE_FOLDER_4':['捷可 (剪輯/文案統籌)','採訪文字'],
 'CONFIGURE_DRIVE_FOLDER_5':['盈萱 (形象角色/錄製)','導覽圖文']
};
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('內門文化地圖｜雲端工作區');}
// Names ending in _ cannot be called through google.script.run.
function withLock_(action){const lock=LockService.getScriptLock();lock.waitLock(30000);try{return action();}finally{lock.releaseLock();}}
function indexFile_(){
 const root=DriveApp.getFolderById(ROOT_ID),it=root.getFilesByName(INDEX_NAME);
 if(it.hasNext()){const file=it.next();if(it.hasNext())throw Error('發現多個索引檔，請先整理，避免讀錯資料');return file;}
 return root.createFile(INDEX_NAME,JSON.stringify({revision:0,materials:[]}),MimeType.PLAIN_TEXT);
}
function readIndex_(file){const data=JSON.parse(file.getBlob().getDataAsString('UTF-8'));if(!Number.isInteger(data.revision)||!Array.isArray(data.materials))throw Error('雲端索引格式不正確');return data;}
function validate_(items){
 if(!Array.isArray(items)||items.length>10000)throw Error('索引最多 10,000 筆');
 const ids={}; const statuses=['已採集未整理','內文撰寫中','影音剪輯中','已發布'];
 return items.map(m=>{if(!m||typeof m.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(m.id)||ids[m.id])throw Error('編號格式不正確或重複');ids[m.id]=true;
 if(typeof m.title!=='string'||!m.title.trim()||statuses.indexOf(m.status)<0)throw Error('標題或狀態不正確');
 const n={};['id','title','member','theme','location','status','type','image','driveLink','desc','note','createdAt'].forEach(k=>{if(m[k]!=null&&typeof m[k]!=='string')throw Error('欄位必須為文字');n[k]=(m[k]||'').slice(0,50000);});
 ['image','driveLink'].forEach(k=>{if(n[k]&&!/^https?:\/\//i.test(n[k]))throw Error('連結必須是 http 或 https');});return n;});
}
function commit_(file,data){const text=JSON.stringify(data);if(Utilities.newBlob(text).getBytes().length>8*1024*1024)throw Error('索引超過 8 MB');file.setContent(text);return data;}
function readWorkspace(){return withLock_(()=>readIndex_(indexFile_()));}
function writeWorkspace(items,expectedRevision){return withLock_(()=>{const file=indexFile_(),data=readIndex_(file);if(data.revision!==expectedRevision)throw Error('雲端版本已更新；請匯出本機備份，再載入雲端版本');return commit_(file,{revision:data.revision+1,materials:validate_(items)});});}
function listWorkspaceFolders(){
 const children=DriveApp.getFolderById(ROOT_ID).getFolders(),result=[];
 while(children.hasNext()){const folder=children.next();result.push({id:folder.getId(),name:folder.getName()});}
 return result.sort((a,b)=>a.name.localeCompare(b.name,'zh-TW'));
}
function uploadWorkspaceFile(payload,expectedRevision){return withLock_(()=>{
 if(!payload||typeof payload.folderId!=='string'||!listWorkspaceFolders().some(f=>f.id===payload.folderId))throw Error('不允許的分類資料夾，請重新讀取分類');
 if(typeof payload.name!=='string'||!payload.name.trim()||payload.name.length>255)throw Error('檔名不正確');
 if(typeof payload.data!=='string'||payload.data.length>14*1024*1024)throw Error('檔案超過限制');
 const index=indexFile_(),data=readIndex_(index);if(data.revision!==expectedRevision)throw Error('雲端版本已更新，請先載入最新索引');
 const bytes=Utilities.base64Decode(payload.data);if(bytes.length>10*1024*1024)throw Error('每檔上限 10 MB');
 const folder=DriveApp.getFolderById(payload.folderId),parents=folder.getParents();let isChild=false;while(parents.hasNext()){if(parents.next().getId()===ROOT_ID)isChild=true;}if(!isChild)throw Error('分類資料夾不在指定工作區');
 const mime=typeof payload.mimeType==='string'&&/^[\w.+-]+\/[\w.+-]+$/.test(payload.mimeType)?payload.mimeType:'application/octet-stream';
 const upload=folder.createFile(Utilities.newBlob(bytes,mime,payload.name));
 try{const config=FOLDERS[payload.folderId]||['捷可 (剪輯/文案統籌)','導覽圖文'];const meta=payload.metadata||{};const text=(key,fallback)=>typeof meta[key]==='string'?meta[key].slice(0,50000):fallback;data.materials.unshift({id:'NM-'+Utilities.getUuid(),title:text('title','')?(text('title','')+' ｜ '+payload.name):payload.name,member:text('member',config[0]),theme:text('theme','採訪與文史紀錄'),location:text('location',''),status:text('status','已採集未整理'),type:text('type',config[1]),image:'',driveLink:upload.getUrl(),desc:text('desc','')+'\n批次上傳至「'+folder.getName()+'」；原始檔名：'+payload.name,note:text('note',''),createdAt:Utilities.formatDate(new Date(),'Asia/Taipei','yyyy-MM-dd')});
 data.materials=validate_(data.materials);data.revision++;return commit_(index,data);
 }catch(error){try{upload.setTrashed(true);}catch(cleanup){throw Error('索引更新失敗，檔案仍位於 Drive，請先確認再重試：'+error.message);}throw error;}
});}

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
