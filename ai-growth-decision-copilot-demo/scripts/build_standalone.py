from pathlib import Path
import base64,csv,json,re,zipfile
root=Path(__file__).resolve().parents[1]; out=root; dist=root/'dist'
schema=json.loads((dist/'data/schema.json').read_text())
data={}
for name,table in schema['tables'].items():
    rows=list(csv.DictReader((dist/'data'/f'{name}.csv').open(encoding='utf-8-sig',newline='')))
    for row in rows:
        for field in table['fields']:
            key=field['name'];value=row[key]
            row[key]=None if value=='' else int(value) if field['type']=='integer' else float(value) if field['type']=='number' else value
    data[name]=rows
def js(value):return json.dumps(value,ensure_ascii=False).replace('</','<\\/')
downloads={p.name:'data:'+('application/zip' if p.suffix=='.zip' else 'text/plain;charset=utf-8')+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in (dist/'data').iterdir() if p.is_file()}
engine=(dist/'engine.mjs').read_text().replace('export function','function').replace('export const','const')
app=(dist/'app.mjs').read_text()
imports=re.search(r"import \{([^}]+)\} from './engine.mjs';",app).group(1)
app=re.sub(r"import \{[^}]+\} from './engine.mjs';",'const {'+imports+'}=DemoEngine;',app)
start="try{schema=await get('data/schema.json');data=Object.fromEntries(await Promise.all(Object.keys(schema.tables).map(async k=>[k,coerce(parseCSV(await get(`data/${k}.csv`,'text')),schema.tables[k])])));summary=summarize(data);initializeWorkspace();render();}"
assert start in app
app=app.replace(start,'try{schema=EMBEDDED_SCHEMA;data=EMBEDDED_DATA;summary=summarize(data);initializeWorkspace();render();}')
app=app.replace('href="data/${table}.csv" download','href="${DOWNLOADS[table+\'.csv\']}" download="${table}.csv"')
for name,url in downloads.items():app=app.replace('href="data/'+name+'" download','href="'+url+'" download="'+name+'"')
html=(dist/'index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','<style>'+(dist/'styles.css').read_text().replace("@import url('data:text/css,');",'')+'</style>')
for name,url in downloads.items():html=html.replace('href="data/'+name+'" download','href="'+url+'" download="'+name+'"')
script='const DemoEngine=(()=>{'+engine+';return {'+imports+'};})();\nconst EMBEDDED_SCHEMA='+js(schema)+';\nconst EMBEDDED_DATA='+js(data)+';\nconst DOWNLOADS='+js(downloads)+';\n'+app
html=html.replace('<script type="module" src="app.mjs"></script>','<script type="module">'+script.replace('</script','<\\/script')+'</script>')
(out/'index.html').write_text(html)
print('Built index.html')
