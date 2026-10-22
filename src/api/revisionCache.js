const STORAGE_KEY='koenji_1889_revision_cache_v1';

// Historical boards are immutable. Keep a small per-tab LRU across reloads and
// share in-flight reads, scoped to both the room and the authorized credential.
export class RevisionCache {
  constructor({storage=null,limit=12,maxChars=800000}={}) {
    Object.assign(this,{storage,limit,maxChars});this.values=new Map();this.pending=new Map();
    try {
      const entries=JSON.parse(storage?.getItem(STORAGE_KEY) || '[]');
      if(Array.isArray(entries))for(const item of entries.slice(-limit)) {
        if(Array.isArray(item) && typeof item[0]==='string' && item[1]?.state)this.values.set(item[0],item[1]);
      }
    } catch {}
    this.trim();
  }
  trim() {
    while(this.values.size>this.limit)this.values.delete(this.values.keys().next().value);
    let raw=JSON.stringify([...this.values]);
    while(raw.length>this.maxChars && this.values.size) {
      this.values.delete(this.values.keys().next().value);raw=JSON.stringify([...this.values]);
    }
    try {this.storage?.setItem(STORAGE_KEY,raw);} catch {}
  }
  async read(room,token,revision,load) {
    const key=JSON.stringify([room,token,revision]);
    if(this.values.has(key)) {
      const value=this.values.get(key);this.values.delete(key);this.values.set(key,value);
      this.trim();return structuredClone(value);
    }
    if(!this.pending.has(key)) {
      const request=Promise.resolve().then(load).then(value=>{
        this.values.set(key,structuredClone(value));this.trim();return value;
      }).finally(()=>this.pending.delete(key));
      this.pending.set(key,request);
    }
    return structuredClone(await this.pending.get(key));
  }
}
