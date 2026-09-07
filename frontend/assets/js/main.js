(function(){
'use strict';

const SOCIALS={
 instagram:'https://www.instagram.com/realtyhub_kazhakootam?igsh=MXJqenlncGlnc3F4eQ==',
 facebook:'https://www.facebook.com/share/19FeZ9qFMh/',
 linkedin:'https://www.linkedin.com/company/realtyhubkerala/'
};

/* ============================== Backend API layer ==============================
   Everything below used to read/write assets/js "seed" data straight out of
   localStorage (a frontend-only demo database). It now talks to the real
   Django REST Framework backend that ships alongside this site. The API is
   served from the SAME Django project that serves this HTML/CSS/JS, so all
   requests are same-origin, relative paths like /api/properties/. */
const API_BASE = 'https://api.realtyhub.co.in/api';
const AUTH_KEY='rh_admin'; /* holds the DRF auth token once an admin logs in */

function getToken(){try{return sessionStorage.getItem(AUTH_KEY);}catch(e){return null;}}
function setToken(token){try{sessionStorage.setItem(AUTH_KEY,token);}catch(e){}}
function clearToken(){try{sessionStorage.removeItem(AUTH_KEY);}catch(e){}}

async function apiRequest(path,{method='GET',body=null,isForm=false}={}){
 const headers={};
 const token=getToken();
 if(token)headers['Authorization']='Token '+token;
 if(!isForm&&body!==null)headers['Content-Type']='application/json';
 let res;
 try{
  res=await fetch(API_BASE+path,{method,headers,body:isForm?body:(body!==null?JSON.stringify(body):undefined)});
 }catch(e){
  throw new Error('Could not reach the server. Is the Django backend running?');
 }
 if(res.status===204)return null;
 let data=null;
 try{data=await res.json();}catch(e){data=null;}
 if(!res.ok){
  const msg=(data&&(data.detail||Object.values(data)[0]))||('Request failed ('+res.status+')');
  throw new Error(Array.isArray(msg)?msg[0]:String(msg));
 }
 return data;
}
const RESOURCE_PATHS={properties:'/properties/',vehicles:'/vehicles/',inquiries:'/inquiries/',testimonials:'/testimonials/',blog:'/blog/',categories:'/categories/'};

async function apiList(key){return apiRequest(RESOURCE_PATHS[key]);}
async function apiGetOne(key,id){return apiRequest(RESOURCE_PATHS[key]+id+'/');}
async function apiCreate(key,data,isForm){return apiRequest(RESOURCE_PATHS[key],{method:'POST',body:data,isForm});}
async function apiUpdate(key,id,data,isForm){return apiRequest(RESOURCE_PATHS[key]+id+'/',{method:'PATCH',body:data,isForm});}
async function apiDelete(key,id){return apiRequest(RESOURCE_PATHS[key]+id+'/',{method:'DELETE'});}
/* Removes a single extra gallery photo (not the main image) from a
   property or vehicle. galleryImageId is the PropertyImage/VehicleImage id. */
async function apiDeleteGalleryImage(key,galleryImageId){return apiRequest('/'+key+'/gallery/'+galleryImageId+'/',{method:'DELETE'});}
async function apiUploadPropertyGallery(propertyId,files){
 const fd=new FormData();
 Array.from(files||[]).forEach(f=>fd.append('images',f));
 return apiRequest('/properties/gallery/'+encodeURIComponent(propertyId)+'/upload/',{method:'POST',body:fd,isForm:true});
}
async function apiUploadVehicleGallery(vehicleId,files){
 const fd=new FormData();
 Array.from(files||[]).forEach(f=>fd.append('images',f));
 return apiRequest('/vehicles/gallery/'+encodeURIComponent(vehicleId)+'/upload/',{method:'POST',body:fd,isForm:true});
}

/* ---------- Image helpers ----------
   Previously this pulled live keyword-search photography from a third-party
   service (LoremFlickr). That service returns whatever photo it currently
   has tagged with the requested keywords, so results were unpredictable —
   on some loads it served an unrelated photo instead of a property/vehicle/
   office shot. Everything now resolves to assets that ship with the site
   (self-hosted, always available, no external request) as a *fallback* only
   when a listing has no real photo uploaded through the admin panel yet. */
function avatarFor(name){return 'https://ui-avatars.com/api/?background=0d687f&color=fff&bold=true&name='+encodeURIComponent(name||'Realty Hub');}

var PROPERTY_IMAGES={
 'Residential Villa':['assets/images/properties/white-modern-villa.jpg','assets/images/properties/modern-villa-pool.jpg','assets/images/properties/luxury-living-room.jpg'],
 'Luxury Apartment':['assets/images/properties/waterfront-residences.jpg','assets/images/properties/rooftop-infinity-pool.jpg','assets/images/properties/luxury-living-room.jpg'],
 'Single Family Home':['assets/images/properties/white-modern-villa.jpg','assets/images/properties/modern-villa-pool.jpg','assets/images/properties/luxury-living-room.jpg'],
 'Modern Waterfront':['assets/images/properties/waterfront-residences.jpg','assets/images/properties/rooftop-infinity-pool.jpg'],
 'Commercial Space':['assets/images/about/realty-hub-office.jpg'],
 'Plot / Land':['assets/images/properties/modern-villa-pool.jpg','assets/images/properties/white-modern-villa.jpg']
};
var VEHICLE_IMAGES={
 'SUV/MUV':['assets/images/vehicles/rolls-royce-cullinan.jpg'],
 'Sedan':['assets/images/vehicles/amg-gt-coupe.jpg'],
 'Hatchback':['assets/images/vehicles/classic-convertible.jpg'],
 'Bike/Scooter':['assets/images/vehicles/classic-convertible.jpg','assets/images/vehicles/amg-gt-coupe.jpg']
};
var BLOG_IMAGES={
 'Market Insights':['assets/images/properties/rooftop-infinity-pool.jpg'],
 'Finance Tips':['assets/images/about/realty-hub-office.jpg'],
 'Property Management':['assets/images/about/realty-hub-office.jpg'],
 'Property Guides':['assets/images/properties/white-modern-villa.jpg','assets/images/properties/modern-villa-pool.jpg'],
 'Buying Guides':['assets/images/properties/luxury-living-room.jpg']
};
function pickFor(id,list){
 if(!list||!list.length)return 'assets/images/about/about-villa-day.jpg';
 var h=0;var s=String(id||'x');for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))>>>0;}
 return list[h%list.length];
}
function themedImage(kind,item,suffix){
 var list=['assets/images/about/about-villa-day.jpg'];
 if(kind==='property')list=PROPERTY_IMAGES[item.category]||['assets/images/about/about-villa-day.jpg'];
 else if(kind==='vehicle')list=VEHICLE_IMAGES[item.type]||['assets/images/about/about-concept-vehicle.jpg'];
 else if(kind==='blog')list=BLOG_IMAGES[item.category]||['assets/images/about/about-villa-day.jpg'];
 return pickFor((item.id||'')+(suffix||''),list);
}
function withMedia(list,kind){
 return (list||[]).map(item=>{
  const hasUploadedImage=!!item.image;
  if(!item.image)item.image=themedImage(kind,item,'');

  // Never invent extra gallery photos when the admin has uploaded a real
  // photo. The detail page must show the exact photos stored for this
  // listing. Only listings with no uploaded image get the local fallback
  // set so the public site never looks empty.
  if(!item.images||!item.images.length){
   item.images=hasUploadedImage?[item.image]:[item.image,themedImage(kind,item,'b'),themedImage(kind,item,'c')];
  }
  return item;
 });
}

/* get(key): fetches a whole collection from the API (mirrors the old
   localStorage-backed sync function, now async). Properties/vehicles/blog
   get the local themed-image fallback applied on top of any real uploaded
   photos. */
async function get(key){
 if(key==='featured')return apiRequest('/featured/');
 if(key==='profile')return apiRequest('/profile/');
 let arr=await apiList(key);
 if(key==='properties')arr=withMedia(arr,'property');
 if(key==='vehicles')arr=withMedia(arr,'vehicle');
 if(key==='blog')arr=withMedia(arr,'blog');
 return arr;
}

function esc(value){
 return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function priceValue(price){return Number(String(price||'').replace(/[^\d]/g,''))||0;}
function statusBadge(status){
 const cls='status-'+String(status||'').toLowerCase().replace(/\s+/g,'-');
 return '<span class="status '+cls+'">'+esc(status||'—')+'</span>';
}
function thumb(label,image){
 if(image)return '<div class="thumb"><img src="'+esc(image)+'" alt="'+esc(label||'')+'" loading="lazy"></div>';
 return '<div class="thumb"><span>'+esc(String(label||'IMAGE').slice(0,12).toUpperCase())+'</span></div>';
}
function mediaCover(image,label,extraClass){
 return '<div class="property-image '+(extraClass||'')+'"><img src="'+esc(image)+'" alt="'+esc(label||'')+'" loading="lazy" onerror="this.style.display=\'none\'"></div>';
}
function formDataObject(form){
 const o={};
 new FormData(form).forEach((v,k)=>{if(typeof v==='string')o[k]=v;});
 form.querySelectorAll('input[type=checkbox]').forEach(i=>{if(i.name)o[i.name]=i.checked;});
 return o;
}
/* Builds a multipart FormData payload for forms that include real file
   uploads (property/vehicle photos, blog cover image). Empty optional
   fields are omitted so numeric fields (bedrooms, year, etc.) don't fail
   backend validation when left blank. */
function buildMultipart(form,opts){
 opts=opts||{};
 const fd=new FormData();
 const fileNames=new Set();
 form.querySelectorAll('input[type=file]').forEach(inp=>{if(inp.name)fileNames.add(inp.name);});
 Array.from(form.elements).forEach(el=>{
  if(!el.name||fileNames.has(el.name))return;
  if(el.tagName==='BUTTON')return;
  if(el.type==='checkbox'){fd.set(el.name,el.checked?'true':'false');return;}
  if(el.value==='')return;
  fd.set(el.name,el.value);
 });
 if(opts.multiFileField){
  const input=form.elements[opts.multiFileField];
  const files=input&&input.files?Array.from(input.files):[];
  if(files.length)fd.set('image',files[0]);
 }
 if(opts.singleFileField){
  const input=form.elements[opts.singleFileField];
  if(input&&input.files&&input.files[0])fd.set(opts.singleFileField,input.files[0]);
 }
 return fd;
}
/* Renders the "Current Images" block on an edit form: the main photo
   (no remove button — swap it by just uploading a new main photo) plus
   each extra gallery photo with a × button that deletes it immediately
   via the API. key is 'properties' or 'vehicles'. */
function renderExistingGallery(form,key,item){
 const wrap=form.querySelector('[data-existing-gallery]');
 const box=form.querySelector('[data-existing-images]');
 if(!wrap||!box)return;
 const gallery=item.gallery||[];
 if(!item.image&&!gallery.length){wrap.hidden=true;return;}
 wrap.hidden=false;
 box.innerHTML='';
 if(item.image){
  const t=document.createElement('div');t.className='thumb-existing';t.dataset.isMain='';
  t.innerHTML='<img src="'+esc(item.image)+'" alt="Main photo"><small>Main</small>';
  box.appendChild(t);
 }
 gallery.forEach(g=>{
  const t=document.createElement('div');t.className='thumb-existing';
  t.innerHTML='<img src="'+esc(g.image)+'" alt="Gallery photo"><button type="button" class="thumb-remove" title="Remove photo">×</button>';
  t.querySelector('.thumb-remove').addEventListener('click',async()=>{
   if(!confirm('Remove this photo?'))return;
   try{await apiDeleteGalleryImage(key,g.id);t.remove();}catch(err){showError(err);}
  });
  box.appendChild(t);
 });
}
function qs(name){return new URLSearchParams(location.search).get(name);}
function showError(err){console.error(err);alert(err&&err.message?err.message:'Something went wrong. Please try again.');}

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

document.querySelectorAll('[data-newsletter-form]').forEach(form=>form.addEventListener('submit',e=>{
 e.preventDefault();
 const notice=form.parentElement.querySelector('[data-newsletter-notice]');
 const input=form.querySelector('input[type="email"]');
 if(notice){notice.textContent='Thanks for subscribing — check your inbox to confirm.';}
 if(input)input.value='';
}));
document.querySelectorAll('[data-social]').forEach(el=>{const key=el.dataset.social;if(SOCIALS[key])el.href=SOCIALS[key];});

const menu=document.querySelector('[data-menu]');
const nav=document.querySelector('[data-nav]');
if(menu&&nav)menu.addEventListener('click',()=>{nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(nav.classList.contains('open')));});

const current=location.pathname.split('/').pop()||'index.html';
if(document.body.dataset.adminPage && typeof sessionStorage!=='undefined' && !sessionStorage.getItem(AUTH_KEY)){location.href='../login.html';}
document.querySelectorAll('.nav-links a').forEach(a=>{if(a.getAttribute('href')===current)a.classList.add('active');});
document.querySelectorAll('.admin-nav a').forEach(a=>{
 if(a.getAttribute('href')===current||a.getAttribute('href').endsWith('/'+current))a.classList.add('active');
});

const adminMenu=document.querySelector('[data-admin-menu]');
const adminSide=document.querySelector('[data-admin-sidebar]');
if(adminMenu&&adminSide)adminMenu.addEventListener('click',()=>adminSide.classList.toggle('open'));

document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',async()=>{
 try{await apiRequest('/auth/logout/',{method:'POST'});}catch(e){/* token already invalid/offline — still log out locally */}
 clearToken();location.href='../login.html';
}));

document.querySelectorAll('[data-search-mode]').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('[data-search-mode]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 const mode=btn.dataset.searchMode;
 const form=btn.closest('form');if(!form)return;
 const hidden=form.querySelector('input[name="listing_type"]');
 if(hidden)hidden.value=mode==='buy'?'sale':(mode==='rent'?'rent':'');
 form.dataset.target=mode==='vehicle'?'vehicles.html':'properties.html';
 ['buy','rent','vehicle'].forEach(key=>{
  const panel=form.querySelector('[data-search-fields="'+key+'"]');
  if(!panel)return;
  const active=key===mode;
  panel.hidden=!active;
  panel.querySelectorAll('input,select').forEach(el=>el.disabled=!active);
 });
}));

/* Nav dropdown: tap-to-toggle on touch/mobile (desktop uses CSS hover) */
document.addEventListener('click',e=>{
 const caret=e.target.closest('.dropdown-caret');
 if(caret){
  e.preventDefault();
  const wrap=caret.closest('.nav-dropdown');
  document.querySelectorAll('.nav-dropdown.mobile-open').forEach(el=>{if(el!==wrap)el.classList.remove('mobile-open');});
  wrap.classList.toggle('mobile-open');
  return;
 }
 if(!e.target.closest('.nav-dropdown'))document.querySelectorAll('.nav-dropdown.mobile-open').forEach(el=>el.classList.remove('mobile-open'));
});

/* Contact page: prefill Subject/Interest from ?subject= (used by nav dropdown "Sell" links) */
(function prefillContactSubject(){
 const select=document.querySelector('[data-contact-form] select[name="subject"]');
 if(!select)return;
 const subject=qs('subject');
 if(subject){
  const match=Array.from(select.options).find(o=>o.value.toLowerCase()===subject.toLowerCase()||o.textContent.toLowerCase()===subject.toLowerCase());
  if(match)select.value=match.value;
 }
 const intent=qs('intent');
 if(intent==='sell'){
  const msg=document.querySelector('[data-contact-form] textarea[name="message"]');
  if(msg&&!msg.value)msg.placeholder='I would like to list my '+(subject||'asset').toLowerCase()+' for sale. Here are the details...';
 }
})();
document.querySelectorAll('[data-search-form]').forEach(form=>form.addEventListener('submit',e=>{
 e.preventDefault();const data=new FormData(form),params=new URLSearchParams();
 data.forEach((value,key)=>{if(String(value).trim())params.set(key,String(value).trim());});
 location.href=(form.dataset.target||'properties.html')+(params.toString()?'?'+params.toString():'');
}));

/* ---------- Enquiry / visit / contact forms -> real Inquiry rows via the API ---------- */
function showFormSuccess(form,assetTitle,attachmentNames,ref){
 const card=form.closest('.form-card')||form.parentElement;
 const now=new Date();
 const dateStr=now.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' · '+now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
 const emailField=form.querySelector('input[type=email]');
 const phoneField=form.querySelector('input[type=tel]');
 const contact=(emailField&&emailField.value)?emailField.value:((phoneField&&phoneField.value)?phoneField.value:'—');
 const attachmentRow=attachmentNames?'<div><span>Attachments</span><strong>'+esc(attachmentNames)+'</strong></div>':'';
 card.innerHTML='<div class="success-panel"><div class="success-check">✓</div><h2>Enquiry Submitted Successfully!</h2><p>Thank you for your interest. Our specialized concierge team will review your enquiry and get back to you within 24 hours.</p><div class="success-box"><div><span>Enquired Asset</span><strong>'+esc(assetTitle||'General Enquiry')+'</strong></div><div><span>Reference ID</span><strong>'+esc(ref)+'</strong></div><div><span>Submitted On</span><strong>'+esc(dateStr)+'</strong></div><div><span>Preferred Contact</span><strong>'+esc(contact)+'</strong></div>'+attachmentRow+'</div><div class="form-actions" style="justify-content:center"><a class="btn btn-primary" href="properties.html">Browse More Properties</a><a class="btn btn-outline" href="index.html">Return to Home</a></div><p class="meta" style="margin-top:14px">Need immediate assistance? Call us at <a class="text-link" href="tel:+917736699344">+91 7736699344</a></p></div>';
}
document.querySelectorAll('[data-enquiry-form],[data-visit-form],[data-contact-form]').forEach(form=>form.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!form.checkValidity()){form.reportValidity();return;}
 const submitBtn=form.querySelector('[type=submit]');if(submitBtn)submitBtn.disabled=true;
 const assetTitle=form.dataset.assetTitle||document.title.split('|')[0].trim();
 const fileField=form.querySelector('input[type=file]');
 const attachmentNames=fileField&&fileField.files&&fileField.files.length?Array.from(fileField.files).map(f=>f.name).join(', '):'';
 try{
  const payload={
   name:(form.querySelector('input[name=name]')||{}).value||'Website Visitor',
   phone:(form.querySelector('input[type=tel]')||{}).value||'',
   email:(form.querySelector('input[type=email]')||{}).value||'',
   interest:assetTitle,
   type:form.dataset.assetType||'General',
   message:(form.querySelector('textarea')||{}).value||'',
   attachments:attachmentNames,
   status:'New'
  };
  const created=await apiCreate('inquiries',payload);
  showFormSuccess(form,assetTitle,attachmentNames,'RH-'+(created&&created.id?String(created.id).padStart(5,'0'):'0000'));
 }catch(err){
  if(submitBtn)submitBtn.disabled=false;
  showError(err);
 }
}));

/* Admin login: authenticates against the Django backend and stores the
   returned auth token (used as the Authorization header for every
   subsequent admin API call, and as the "is an admin logged in?" flag). */
const login=document.querySelector('[data-login-form]');
if(login)login.addEventListener('submit',async e=>{
 e.preventDefault();
 const email=login.querySelector('input[type=email]'),password=login.querySelector('[data-password-input]'),notice=login.querySelector('.notice');
 if(!email.value||!password.value){if(notice){notice.className='notice error';notice.textContent='Please enter your email and password.';}return;}
 const submitBtn=login.querySelector('[type=submit]');if(submitBtn)submitBtn.disabled=true;
 try{
  const data=await apiRequest('/auth/login/',{method:'POST',body:{email:email.value,password:password.value}});
  setToken(data.token);
  location.href='admin/dashboard.html';
 }catch(err){
  if(notice){notice.className='notice error';notice.textContent=err.message||'Incorrect email or password.';}
  if(submitBtn)submitBtn.disabled=false;
 }
});

/* Eye icon: toggles a password field between hidden (dots) and visible (plain
   text) so admins can check what they typed before submitting. */
document.querySelectorAll('[data-password-toggle]').forEach(btn=>{
 btn.addEventListener('click',()=>{
  const wrap=btn.closest('.password-field');
  const input=wrap&&wrap.querySelector('input');
  if(!input)return;
  const showing=input.type==='text';
  input.type=showing?'password':'text';
  btn.setAttribute('aria-pressed',String(!showing));
  btn.setAttribute('aria-label',showing?'Show password':'Hide password');
  const eyeOn=btn.querySelector('.icon-eye'),eyeOff=btn.querySelector('.icon-eye-off');
  if(eyeOn)eyeOn.style.display=showing?'':'none';
  if(eyeOff)eyeOff.style.display=showing?'none':'';
 });
});

/* Image previews (client-side only, before upload) */
document.querySelectorAll('input[type=file]').forEach(input=>{
 input.addEventListener('change',()=>{
  const preview=input.closest('.field')?.querySelector('[data-image-preview]')||input.closest('.upload-zone')?.parentElement?.querySelector('[data-image-preview]');
  if(!preview)return;
  preview.innerHTML='';
  const files=Array.from(input.files||[]).filter(file=>file.type.startsWith('image/'));
  files.forEach((file,index)=>{
   const wrap=document.createElement('div');
   wrap.className='thumb-upload';
   wrap.title=file.name;
   wrap.innerHTML='<img alt="'+esc(file.name)+'" src="'+URL.createObjectURL(file)+'"><small>'+(index===0?'Main':'Photo '+(index+1))+'</small>';
   preview.appendChild(wrap);
  });
  const count=document.createElement('div');
  count.className='upload-count';
  count.textContent=files.length?files.length+' image'+(files.length===1?'':'s')+' selected':'No images selected';
  preview.appendChild(count);
 });
});

/* ============================== ADMIN: Properties ============================== */
async function renderProperties(){
 const tbody=document.querySelector('#properties-table');if(!tbody)return;
 const search=(document.querySelector('[data-table-search="properties"]')?.value||'').toLowerCase();
 const status=document.querySelector('[data-filter-status]')?.value||'';
 let all;try{all=await get('properties');}catch(err){showError(err);return;}
 const data=all.filter(p=>(!status||p.status===status)&&[p.title,p.category,p.location,p.price].join(' ').toLowerCase().includes(search));
 const count=document.querySelector('[data-count="properties"]');if(count)count.textContent=data.length+' properties';
 tbody.innerHTML=data.map(p=>`<tr>
  <td><div class="table-title">${thumb(p.title,p.image)}<div><strong>${esc(p.title)}</strong><small>${esc(p.bedrooms||0)} Bed · ${esc(p.bathrooms||0)} Bath · ${esc(p.area||'—')}</small></div></div></td>
  <td>${esc(p.category)}</td><td>${esc(p.location)}</td><td><strong>${esc(p.price)}</strong></td><td>${statusBadge(p.status)}</td>
  <td><div class="toggle-cell"><label class="switch"><input type="checkbox" data-feature-property="${p.id}" ${p.featured?'checked':''}><span></span></label></div></td>
  <td><div class="admin-actions"><a class="btn btn-outline" href="property-form.html?edit=${encodeURIComponent(p.id)}">Edit</a><button class="btn btn-danger" data-delete-property="${p.id}">Delete</button></div></td>
 </tr>`).join('')||'<tr><td colspan="7"><div class="empty-state">No properties match your filters.</div></td></tr>';
}
document.addEventListener('input',e=>{if(e.target.matches('[data-table-search="properties"]'))renderProperties();});
document.addEventListener('change',async e=>{
 if(e.target.matches('[data-filter-status]')&&document.body.dataset.adminPage==='properties')renderProperties();
 if(e.target.matches('[data-feature-property]')){
  const id=e.target.dataset.featureProperty,checked=e.target.checked;
  try{await apiUpdate('properties',id,{featured:checked});}catch(err){e.target.checked=!checked;showError(err);}
 }
});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-delete-property]');if(!b)return;
 if(confirm('Delete this property from the inventory?')){
  try{await apiDelete('properties',b.dataset.deleteProperty);renderProperties();}catch(err){showError(err);}
 }
});
/* Shared by the Property and Vehicle admin forms: lets the admin open the
   file picker more than once and keeps every previously chosen photo
   instead of the browser replacing the selection with only the most
   recently picked file(s). Also renders live thumbnails under the upload
   zone so the admin can see exactly what will be uploaded/appended. */
function setupMultiImagePicker(form,editId){
 const imageInput=form.elements.images;
 let selectedFiles=[];
 const syncFileInput=()=>{
  if(!imageInput||typeof DataTransfer==='undefined')return;
  const dt=new DataTransfer();
  selectedFiles.forEach(f=>dt.items.add(f));
  imageInput.files=dt.files;
 };
 const renderSelected=()=>{
  const box=form.querySelector('[data-image-preview]');if(!box)return;
  box.innerHTML='';
  selectedFiles.forEach((file,i)=>{
   const wrap=document.createElement('div');wrap.className='thumb-upload';wrap.title=file.name;
   const img=document.createElement('img');img.alt='Selected photo '+(i+1);img.src=URL.createObjectURL(file);
   const label=document.createElement('small');label.textContent=editId?'New photo '+(i+1):(i===0?'Main':'Gallery '+i);
   wrap.append(img,label);box.appendChild(wrap);
  });
  const count=document.createElement('div');count.className='upload-count';
  count.textContent=selectedFiles.length?selectedFiles.length+' new image'+(selectedFiles.length===1?'':'s')+' selected':'No new images selected';
  box.appendChild(count);
 };
 if(imageInput){
  imageInput.addEventListener('change',()=>{
   // Keep previously selected files when the user opens the file picker again.
   // This prevents the browser from replacing the earlier selection with only
   // the most recently chosen photo(s).
   const incoming=Array.from(imageInput.files||[]);
   const seen=new Set(selectedFiles.map(f=>f.name+'|'+f.size+'|'+f.lastModified));
   incoming.forEach(f=>{const key=f.name+'|'+f.size+'|'+f.lastModified;if(!seen.has(key)){selectedFiles.push(f);seen.add(key);}});
   syncFileInput();
   renderSelected();
  });
 }
 return {getFiles:()=>selectedFiles};
}

function initPropertyForm(){
 const form=document.querySelector('[data-property-form]');if(!form)return;
 const editId=qs('edit');
 const picker=setupMultiImagePicker(form,editId);
 (async()=>{
  const select=form.querySelector('select[name="category"]');
  const defaultCategories=['Land / Plot','Villa / Apartment','Rental House / Apartment'];
  if(select)select.innerHTML='<option value="">Select Property Category</option>'+defaultCategories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  try{
   const categories=await apiList('categories');
   if(select && Array.isArray(categories) && categories.length){
    const allowed=new Set(defaultCategories.map(c=>c.toLowerCase()));
    const filtered=categories.filter(c=>allowed.has(String(c.name||'').toLowerCase()));
    if(filtered.length)select.innerHTML='<option value="">Select Property Category</option>'+filtered.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
   }
  }catch(err){console.warn('Could not load categories from API; using default property categories.',err);}
  const id=qs('edit');
  if(id){
   try{
    const item=await apiGetOne('properties',id);
    document.querySelector('.admin-title h1').textContent='Edit Property';
    const map={title:item.title,category:item.category,listingType:item.listingType,price:item.price,location:item.location,bedrooms:item.bedrooms,bathrooms:item.bathrooms,area:item.area,status:item.status,amenities:item.amenities,description:item.description};
    Object.entries(map).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??'';});
    if(form.elements.featured)form.elements.featured.checked=!!item.featured;
    try{renderExistingGallery(form,'properties',item);}catch(galleryErr){console.error('Could not render existing gallery photos:',galleryErr);}
   }catch(err){showError(err);}
  }
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   const submitBtn=form.querySelector('[type=submit]');if(submitBtn)submitBtn.disabled=true;
   try{
    // CREATE: first image is the main image; remaining images become gallery.
    // EDIT: never replace the existing main image. Every newly selected image
    // is appended to this property's gallery.
    const selectedFiles=picker.getFiles();
    let saved;
    if(id){
      const fd=buildMultipart(form,{});
      // Do not send a new main image during edit.
      saved=await apiUpdate('properties',id,fd,true);
      if(selectedFiles.length)await apiUploadPropertyGallery(saved.id,selectedFiles);
    }else{
      if(selectedFiles.length){
       const fd=buildMultipart(form,{multiFileField:'images'});
       saved=await apiCreate('properties',fd,true);
       if(selectedFiles.length>1)await apiUploadPropertyGallery(saved.id,selectedFiles.slice(1));
      }else{
       saved=await apiCreate('properties',buildMultipart(form,{}),true);
      }
    }
    location.href='properties.html';
   }catch(err){if(submitBtn)submitBtn.disabled=false;showError(err);}
  });
 })();
}
/* ============================== ADMIN: Vehicles ============================== */
async function renderVehicles(){
 const tbody=document.querySelector('#vehicles-table');if(!tbody)return;
 const search=(document.querySelector('[data-table-search="vehicles"]')?.value||'').toLowerCase(),status=document.querySelector('[data-filter-status]')?.value||'';
 let all;try{all=await get('vehicles');}catch(err){showError(err);return;}
 const data=all.filter(v=>(!status||v.status===status)&&[v.title,v.type,v.brand,v.year,v.price,v.fuel].join(' ').toLowerCase().includes(search));
 const count=document.querySelector('[data-count="vehicles"]');if(count)count.textContent=data.length+' vehicles';
 tbody.innerHTML=data.map(v=>`<tr><td><div class="table-title">${thumb(v.title,v.image)}<div><strong>${esc(v.title)}</strong><small>${esc(v.brand||'')} · ${esc(v.power||'')}</small></div></div></td><td>${esc(v.type)}</td><td>${esc(v.year)}</td><td><strong>${esc(v.price)}</strong></td><td>${esc(v.fuel)}</td><td>${statusBadge(v.status)}</td><td><div class="toggle-cell"><label class="switch"><input type="checkbox" data-feature-vehicle="${v.id}" ${v.featured?'checked':''}><span></span></label></div></td><td><div class="admin-actions"><a class="btn btn-outline" href="vehicle-form.html?edit=${encodeURIComponent(v.id)}">Edit</a><button class="btn btn-danger" data-delete-vehicle="${v.id}">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="8"><div class="empty-state">No vehicles match your filters.</div></td></tr>';
}
document.addEventListener('input',e=>{if(e.target.matches('[data-table-search="vehicles"]'))renderVehicles();});
document.addEventListener('change',async e=>{
 if(e.target.matches('[data-filter-status]')&&document.body.dataset.adminPage==='vehicles')renderVehicles();
 if(e.target.matches('[data-feature-vehicle]')){
  const id=e.target.dataset.featureVehicle,checked=e.target.checked;
  try{await apiUpdate('vehicles',id,{featured:checked});}catch(err){e.target.checked=!checked;showError(err);}
 }
});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-delete-vehicle]');
 if(b&&confirm('Delete this vehicle from the inventory?')){
  try{await apiDelete('vehicles',b.dataset.deleteVehicle);renderVehicles();}catch(err){showError(err);}
 }
});

function initVehicleForm(){
 const form=document.querySelector('[data-vehicle-form]');if(!form)return;
 const id=qs('edit');
 const picker=setupMultiImagePicker(form,id);
 (async()=>{
  if(id){
   try{
    const item=await apiGetOne('vehicles',id);
    document.querySelector('.admin-title h1').textContent='Edit Vehicle';
    Object.entries(item).forEach(([k,v])=>{if(form.elements[k]&&form.elements[k].type!=='file'&&form.elements[k].type!=='checkbox')form.elements[k].value=v??'';});
    if(form.elements.featured)form.elements.featured.checked=!!item.featured;
    try{renderExistingGallery(form,'vehicles',item);}catch(galleryErr){console.error('Could not render existing gallery photos:',galleryErr);}
   }catch(err){showError(err);}
  }
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   const submitBtn=form.querySelector('[type=submit]');if(submitBtn)submitBtn.disabled=true;
   try{
    // CREATE: first image is the main image; remaining images become gallery.
    // EDIT: never replace the existing main image. Every newly selected image
    // is appended to this vehicle's gallery.
    const selectedFiles=picker.getFiles();
    let saved;
    if(id){
     const fd=buildMultipart(form,{});
     // Do not send a new main image during edit.
     saved=await apiUpdate('vehicles',id,fd,true);
     if(selectedFiles.length)await apiUploadVehicleGallery(saved.id,selectedFiles);
    }else{
     if(selectedFiles.length){
      const fd=buildMultipart(form,{multiFileField:'images'});
      saved=await apiCreate('vehicles',fd,true);
      if(selectedFiles.length>1)await apiUploadVehicleGallery(saved.id,selectedFiles.slice(1));
     }else{
      saved=await apiCreate('vehicles',buildMultipart(form,{}),true);
     }
    }
    location.href='vehicles.html';
   }catch(err){if(submitBtn)submitBtn.disabled=false;showError(err);}
  });
 })();
}

/* ============================== ADMIN: Inquiries ============================== */
async function renderInquiries(){
 const tbody=document.querySelector('#inquiries-table');if(!tbody)return;
 const search=(document.querySelector('[data-table-search="inquiries"]')?.value||'').toLowerCase(),status=document.querySelector('[data-filter-status]')?.value||'';
 let all;try{all=await get('inquiries');}catch(err){showError(err);return;}
 const data=all.filter(i=>(!status||i.status===status)&&[i.name,i.email,i.phone,i.interest,i.message].join(' ').toLowerCase().includes(search));
 tbody.innerHTML=data.map(i=>`<tr><td><strong>${esc(i.name)}</strong><small class="table-sub">${esc(i.email)}</small></td><td>${esc(i.phone)}</td><td><strong>${esc(i.interest)}</strong><small class="table-sub">${esc(i.type)}</small></td><td>${esc(i.message)}</td><td><select class="inline-status" data-inquiry-status="${i.id}">${['New','Pending','Contacted','Closed'].map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td>${esc(i.date)}</td><td><button class="btn btn-outline" data-view-inquiry="${i.id}">View</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="empty-state">No inquiries match your filters.</div></td></tr>';
}
document.addEventListener('input',e=>{if(e.target.matches('[data-table-search="inquiries"]'))renderInquiries();});
document.addEventListener('change',async e=>{
 if(e.target.matches('[data-inquiry-status]')){
  const id=e.target.dataset.inquiryStatus,value=e.target.value;
  try{await apiUpdate('inquiries',id,{status:value});}catch(err){showError(err);renderInquiries();}
 }
});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-view-inquiry]');if(!b)return;
 try{
  const i=await apiGetOne('inquiries',b.dataset.viewInquiry);
  alert('Customer: '+i.name+'\nEmail: '+i.email+'\nPhone: '+i.phone+'\nInterested in: '+i.interest+(i.attachments?'\nAttachments: '+i.attachments:'')+'\n\n'+i.message);
 }catch(err){showError(err);}
});

/* ============================== ADMIN: Testimonials + Categories (modals) ============================== */
async function renderTestimonials(){
 const grid=document.querySelector('#testimonials-grid');if(!grid)return;
 let data;try{data=await get('testimonials');}catch(err){showError(err);return;}
 grid.innerHTML=data.map(t=>`<article class="testimonial-card"><div class="testimonial-head"><span class="testimonial-rating star-rating">${'★'.repeat(Number(t.rating||0))}${'☆'.repeat(5-Number(t.rating||0))}</span>${statusBadge(t.status)}</div><h3>${esc(t.name)}</h3><div class="meta">${esc(t.role||'Customer')}</div><p>"${esc(t.review)}"</p><div class="card-actions"><button class="btn btn-outline" data-edit-testimonial="${t.id}">Edit</button><button class="btn btn-danger" data-delete-testimonial="${t.id}">Delete</button></div></article>`).join('');
}
function openModal(sel){const m=document.querySelector(sel);if(m)m.hidden=false;}
function closeModals(){document.querySelectorAll('.modal-backdrop').forEach(m=>m.hidden=true);}
document.addEventListener('click',async e=>{
 if(e.target.closest('[data-open-testimonial]')){const f=document.querySelector('[data-testimonial-form]');f.reset();f.elements.id.value='';document.querySelector('[data-modal-title]').textContent='Add Testimonial';openModal('[data-testimonial-modal]');}
 if(e.target.closest('[data-edit-testimonial]')){
  const id=e.target.closest('[data-edit-testimonial]').dataset.editTestimonial,f=document.querySelector('[data-testimonial-form]');
  try{const t=await apiGetOne('testimonials',id);if(f){Object.entries(t).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v;});document.querySelector('[data-modal-title]').textContent='Edit Testimonial';openModal('[data-testimonial-modal]');}}catch(err){showError(err);}
 }
 if(e.target.closest('[data-delete-testimonial]')){
  const id=e.target.closest('[data-delete-testimonial]').dataset.deleteTestimonial;
  if(confirm('Delete this testimonial?')){try{await apiDelete('testimonials',id);renderTestimonials();}catch(err){showError(err);}}
 }
 if(e.target.closest('[data-open-category]')){const f=document.querySelector('[data-category-form]');f.reset();f.elements.id.value='';openModal('[data-category-modal]');}
 if(e.target.closest('[data-edit-category]')){
  const id=e.target.closest('[data-edit-category]').dataset.editCategory,f=document.querySelector('[data-category-form]');
  try{const c=await apiGetOne('categories',id);if(f){f.elements.id.value=c.id;f.elements.name.value=c.name;f.elements.description.value=c.description;openModal('[data-category-modal]');}}catch(err){showError(err);}
 }
 if(e.target.closest('[data-delete-category]')){
  const id=e.target.closest('[data-delete-category]').dataset.deleteCategory;
  if(confirm('Delete this category?')){try{await apiDelete('categories',id);renderCategories();}catch(err){showError(err);}}
 }
 if(e.target.closest('[data-close-modal]'))closeModals();
});
document.addEventListener('submit',async e=>{
 if(e.target.matches('[data-testimonial-form]')){
  e.preventDefault();const o=formDataObject(e.target),id=o.id;delete o.id;
  try{if(id)await apiUpdate('testimonials',id,o);else await apiCreate('testimonials',o);closeModals();renderTestimonials();}catch(err){showError(err);}
 }
 if(e.target.matches('[data-category-form]')){
  e.preventDefault();const o=formDataObject(e.target),id=o.id;delete o.id;
  try{if(id)await apiUpdate('categories',id,o);else await apiCreate('categories',o);closeModals();renderCategories();}catch(err){showError(err);}
 }
});

/* ============================== ADMIN: Blog ============================== */
async function renderBlog(){
 const tbody=document.querySelector('#blog-table');if(!tbody)return;
 const search=(document.querySelector('[data-table-search="blog"]')?.value||'').toLowerCase(),cat=document.querySelector('[data-filter-category]')?.value||'',status=document.querySelector('[data-filter-status]')?.value||'';
 let all;try{all=await get('blog');}catch(err){showError(err);return;}
 const data=all.filter(b=>(!cat||b.category===cat)&&(!status||b.status===status)&&[b.title,b.category,b.author,b.tags].join(' ').toLowerCase().includes(search));
 const count=document.querySelector('[data-count="blog"]');if(count)count.textContent=data.length+' posts';
 tbody.innerHTML=data.map(b=>`<tr><td><div class="table-title">${thumb(b.title,b.image)}<div><strong>${esc(b.title)}</strong><small>${esc(b.tags||'')}</small></div></div></td><td>${esc(b.category)}</td><td>${esc(b.author||'Admin')}</td><td>${statusBadge(b.status)}</td><td>${esc(b.date)}</td><td>${esc(b.views||0)}</td><td><div class="admin-actions"><a class="btn btn-outline" href="blog-editor.html?edit=${encodeURIComponent(b.id)}">Edit</a><button class="btn btn-danger" data-delete-blog="${b.id}">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="7"><div class="empty-state">No blog posts match your filters.</div></td></tr>';
}
document.addEventListener('input',e=>{if(e.target.matches('[data-table-search="blog"]'))renderBlog();});
document.addEventListener('change',e=>{if((e.target.matches('[data-filter-category]')||e.target.matches('[data-filter-status]'))&&document.body.dataset.adminPage==='blog')renderBlog();});
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-delete-blog]');
 if(b&&confirm('Delete this blog post?')){try{await apiDelete('blog',b.dataset.deleteBlog);renderBlog();}catch(err){showError(err);}}
});

function initBlogForm(){
 const form=document.querySelector('[data-blog-form]');if(!form)return;
 const id=qs('edit');
 (async()=>{
  let existing=null;
  if(id){
   try{
    existing=await apiGetOne('blog',id);
    document.querySelector('.admin-title h1').textContent='Edit Blog Post';
    Object.entries(existing).forEach(([k,v])=>{if(form.elements[k]&&form.elements[k].type!=='file')form.elements[k].value=v??'';});
   }catch(err){showError(err);}
  }
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   const submitBtn=form.querySelector('[type=submit]');if(submitBtn)submitBtn.disabled=true;
   try{
    const fd=buildMultipart(form,{singleFileField:'image'});
    fd.set('author',(form.elements.author&&form.elements.author.value)||'Admin User');
    fd.set('views',String(Number((form.elements.views&&form.elements.views.value)||0)));
    fd.set('date',id?((existing&&existing.date)||'Today'):new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}));
    if(id)await apiUpdate('blog',id,fd,true);else await apiCreate('blog',fd,true);
    location.href='blog.html';
   }catch(err){if(submitBtn)submitBtn.disabled=false;showError(err);}
  });
 })();
}

/* ============================== ADMIN: Featured manager ============================== */
async function renderFeatured(){
 const box=document.querySelector('#featured-list');if(!box)return;
 let props,order;
 try{[props,order]=await Promise.all([get('properties'),get('featured')]);}catch(err){showError(err);return;}
 const map=new Map(props.map(p=>[String(p.id),p]));
 box.innerHTML=order.filter(id=>map.has(String(id))).map(id=>{const p=map.get(String(id));return `<div class="featured-row" draggable="true" data-featured-row="${p.id}"><span class="drag-handle">⋮⋮</span>${thumb(p.title,p.image)}<div><strong>${esc(p.title)}</strong><small>${esc(p.location)} · ${esc(p.category)}</small></div><div class="featured-meta"><strong>${esc(p.price)}</strong><small>${esc(p.area||'')}</small></div><div class="featured-status"><label class="switch"><input type="checkbox" data-feature-visibility="${p.id}" checked><span></span></label></div><button class="btn btn-danger" data-remove-featured="${p.id}">Remove</button></div>`;}).join('')||'<div class="empty-state">No featured properties. Feature a property from Properties.</div>';
 let dragged=null;box.querySelectorAll('.featured-row').forEach(row=>{
  row.addEventListener('dragstart',()=>{dragged=row;row.classList.add('dragging');});
  row.addEventListener('dragend',()=>{row.classList.remove('dragging');dragged=null;});
  row.addEventListener('dragover',e=>{e.preventDefault();if(dragged&&dragged!==row){const rect=row.getBoundingClientRect();row.parentNode.insertBefore(dragged,e.clientY<rect.top+rect.height/2?row:row.nextSibling);}});
 });
}
document.addEventListener('click',async e=>{
 const remove=e.target.closest('[data-remove-featured]');
 if(remove){try{await apiUpdate('properties',remove.dataset.removeFeatured,{featured:false});renderFeatured();}catch(err){showError(err);}}
 if(e.target.closest('[data-save-featured]')){
  const ids=Array.from(document.querySelectorAll('[data-featured-row]')).map(x=>x.dataset.featuredRow);
  try{await apiRequest('/featured/',{method:'POST',body:{order:ids}});alert('Featured carousel order saved.');}catch(err){showError(err);}
 }
});
document.addEventListener('change',async e=>{
 if(e.target.matches('[data-feature-visibility]')){
  const id=e.target.dataset.featureVisibility,checked=e.target.checked;
  try{await apiUpdate('properties',id,{featured:checked});}catch(err){e.target.checked=!checked;showError(err);}
 }
});

/* ============================== ADMIN: Categories ============================== */
async function renderCategories(){
 const grid=document.querySelector('#category-grid');if(!grid)return;
 let data;try{data=await get('categories');}catch(err){showError(err);return;}
 grid.innerHTML=data.map(c=>`<article class="category-admin-card"><h3>${esc(c.name)}</h3><p>${esc(c.description||'No description')}</p><div class="meta-row"><span class="badge">Active</span><div class="admin-actions"><button class="btn btn-outline" data-edit-category="${c.id}">Edit</button><button class="btn btn-danger" data-delete-category="${c.id}">Delete</button></div></div></article>`).join('');
}

/* ============================== ADMIN: Dashboard ============================== */
async function renderDashboard(){
 if(!document.querySelector('[data-dashboard-stats]'))return;
 let stats;try{stats=await apiRequest('/dashboard/');}catch(err){showError(err);return;}
 const setStat=(k,v2)=>{const el=document.querySelector('[data-stat="'+k+'"]');if(el)el.textContent=v2;};
 setStat('properties',stats.properties);setStat('vehicles',stats.vehicles);setStat('inquiries',stats.inquiries);setStat('featured',stats.featured);
 const ib=document.querySelector('#dashboard-inquiries');if(ib)ib.innerHTML=stats.recent_inquiries.map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.interest)}</td><td>${statusBadge(x.status)}</td><td>${esc(x.date)}</td></tr>`).join('');
 const pb=document.querySelector('#dashboard-properties');if(pb)pb.innerHTML=withMedia(stats.recent_properties,'property').map(x=>`<div class="activity-item">${thumb(x.title,x.image)}<div><strong>${esc(x.title)}</strong><small>${esc(x.location)} · ${esc(x.price)}</small></div>${x.featured?'<span class="badge">Featured</span>':''}</div>`).join('');
}

/* Profile */
const profileForm=document.querySelector('[data-profile-form]');
if(profileForm){
 (async()=>{
  try{
   const p=await get('profile');
   if(profileForm.elements.name)profileForm.elements.name.value=p.name||'';
   if(profileForm.elements.phone)profileForm.elements.phone.value=p.phone||'';
   if(profileForm.elements.email)profileForm.elements.email.value=p.email||'';
  }catch(err){/* profile may not exist yet — leave form defaults */}
 })();
 profileForm.addEventListener('submit',async e=>{
  e.preventDefault();
  try{
   const o=formDataObject(profileForm);
   await apiRequest('/profile/',{method:'PATCH',body:{name:o.name,phone:o.phone,email:o.email}});
   alert('Profile saved.');
  }catch(err){showError(err);}
 });
}

/* ============================== PUBLIC: Homepage ============================== */
async function renderHome(){
 const propBox=document.querySelector('#home-properties-grid');
 const vehBox=document.querySelector('#home-vehicles-grid');
 const testBox=document.querySelector('#home-testimonials-grid');
 const blogBox=document.querySelector('#home-blog-grid');
 if(!propBox&&!vehBox&&!testBox&&!blogBox)return;
 let properties=[],vehicles=[],testimonials=[],blog=[];
 try{[properties,vehicles,testimonials,blog]=await Promise.all([get('properties'),get('vehicles'),get('testimonials'),get('blog')]);}catch(err){showError(err);return;}
 if(propBox){
  const items=properties.filter(p=>p.status==='Published'&&p.featured).slice(0,3);
  propBox.innerHTML=items.map(p=>`<article class="feature-property-card reveal-io"><div class="feature-property-media"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="this.style.display='none'"></div><div class="feature-property-body"><div class="price">${esc(p.price)}</div><h3>${esc(p.title)}</h3><div class="meta feature-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"/></svg>${esc(p.location)}</div><div class="spec-row spec-row-property"><span>${esc(p.bedrooms)} Beds</span><span>${esc(p.bathrooms)} Baths</span><span>${esc(p.area)}</span></div><a class="text-link" href="property-details.html?id=${encodeURIComponent(p.id)}">View Details →</a></div></article>`).join('')||'<div class="empty-state">No featured properties yet. Add one from the admin panel.</div>';
 }
 if(vehBox){
  const items=vehicles.filter(v=>v.status==='Published'&&v.featured).slice(0,2);
  vehBox.innerHTML=items.map(v=>`<article class="feature-vehicle-card reveal-io"><div class="feature-vehicle-media"><img src="${esc(v.image)}" alt="${esc(v.title)}" loading="lazy" onerror="this.style.display='none'"></div><div class="feature-vehicle-body"><div class="price">${esc(v.price)}</div><h3>${esc(v.title)}</h3><div class="meta">${esc(v.drivetrain||v.specifications||'')}</div><div class="spec-row spec-row-vehicle"><div><small>Year</small><strong>${esc(v.year)}</strong></div><div><small>Mileage</small><strong>${esc(v.range||'—')}</strong></div><div><small>Power</small><strong>${esc(v.power||'—')}</strong></div></div><a class="btn btn-outline" href="vehicle-details.html?id=${encodeURIComponent(v.id)}">View Vehicle</a></div></article>`).join('')||'<div class="empty-state">No featured vehicles yet.</div>';
 }
 if(testBox){
  const items=testimonials.filter(t=>t.status==='Published').slice(0,2);
  testBox.innerHTML=items.map(t=>`<article class="detail-card reveal-io"><div class="meta star-rating">${'★'.repeat(Number(t.rating||5))}</div><p>"${esc(t.review)}"</p><strong>${esc(t.name)}</strong><div class="meta">${esc(t.role||'Verified Client')}</div></article>`).join('');
 }
 if(blogBox){
  const items=blog.filter(b=>b.status==='Published').slice(0,2);
  blogBox.innerHTML=items.map(b=>`<article class="card reveal-io"><div class="blog-thumb"><img src="${esc(b.image)}" alt="${esc(b.title)}" loading="lazy"></div><div class="card-body"><span class="badge">${esc(b.category)}</span><h3>${esc(b.title)}</h3><p class="meta">${esc(b.excerpt)}</p><div class="meta">${esc(b.author)} · ${esc(b.date)}</div><a class="text-link" href="blog-post.html?id=${encodeURIComponent(b.id)}">Read more →</a></div></article>`).join('');
 }
}

/* ============================== PUBLIC: Properties listing + no-results ============================== */
const BUDGET_RANGES={'Under ₹50 Lakh':[0,5000000],'₹50 Lakh – ₹1 Cr':[5000000,10000000],'₹1 Cr – ₹2 Cr':[10000000,20000000],'₹2 Cr+':[20000000,Infinity]};
function filterProperties(list,o){
 return list.filter(p=>{
  if(p.status!=='Published')return false;
  if(o.location&&!(p.location||'').toLowerCase().includes(o.location.toLowerCase()))return false;
  if(o.property_type){
   const typeMap={plot:'land / plot',land:'land / plot',villa:'villa / apartment',apartment:'villa / apartment',rental:'rental house / apartment'};
   const wanted=typeMap[String(o.property_type).toLowerCase()]||String(o.property_type).toLowerCase();
   if(!(p.category||'').toLowerCase().includes(wanted))return false;
  }
  if(o.listing_type){const want=({sale:'sale',rent:'rent'})[o.listing_type]||o.listing_type;if((p.listingType||'').toLowerCase()!==want)return false;}
  if(o.budget&&BUDGET_RANGES[o.budget]){const [min,max]=BUDGET_RANGES[o.budget],val=priceValue(p.price);if(val<min||val>max)return false;}
  if(o.min_price&&priceValue(p.price)<Number(o.min_price))return false;
  if(o.max_price&&priceValue(p.price)>Number(o.max_price))return false;
  if(o.bedrooms){const need=Number(String(o.bedrooms).replace(/\D/g,''))||0;if(Number(p.bedrooms||0)<need)return false;}
  if(o.q){const hay=[p.title,p.category,p.location,p.listingType].join(' ').toLowerCase();if(!hay.includes(o.q.toLowerCase()))return false;}
  return true;
 });
}
async function renderPublicProperties(){
 const grid=document.querySelector('#properties-results-grid');if(!grid)return;
 let all;try{all=await get('properties');}catch(err){showError(err);return;}
 const params=new URLSearchParams(location.search),o={};
 params.forEach((v,k)=>o[k]=v);
 const searchInput=document.querySelector('[data-live-search]');
 if(searchInput&&searchInput.value)o.q=searchInput.value;
 const data=filterProperties(all,o);
 const countEl=document.querySelector('[data-results-count]');if(countEl)countEl.textContent=data.length+' result'+(data.length===1?'':'s')+' found';
 const noResults=document.querySelector('#no-results-state');
 if(!data.length){
  grid.innerHTML='';grid.style.display='none';
  if(noResults){
   noResults.style.display='block';
   const q=o.q||o.location||'your search criteria';
   const heading=noResults.querySelector('[data-nr-query]');if(heading)heading.textContent=q;
   const altBox=noResults.querySelector('#no-results-alternatives');
   if(altBox){
    const alt=all.filter(p=>p.status==='Published'&&p.featured).slice(0,3);
    altBox.innerHTML=alt.map(p=>`<article class="card">${mediaCover(p.image,p.title)}<div class="card-body"><h3>${esc(p.title)}</h3><div class="meta">${esc(p.location)}</div><div class="price">${esc(p.price)}</div><a class="btn btn-outline" href="property-details.html?id=${encodeURIComponent(p.id)}">View Property</a></div></article>`).join('');
   }
  }
 }else{
  grid.style.display='';if(noResults)noResults.style.display='none';
  grid.innerHTML=data.map(p=>`<article class="card">${mediaCover(p.image,p.title)}<div class="card-body"><span class="badge">${p.featured?'Featured':'Available'}</span><h3>${esc(p.title)}</h3><div class="meta">${esc(p.location)} · ${esc(p.bedrooms)} BHK · ${esc(p.area)}</div><div class="price">${esc(p.price)}</div><a class="btn btn-outline" href="property-details.html?id=${encodeURIComponent(p.id)}">View Property</a></div></article>`).join('');
 }
}
const propFilterForm=document.querySelector('[data-property-filter-form]');
if(propFilterForm){
 const params=new URLSearchParams(location.search);
 params.forEach((v,k)=>{if(propFilterForm.elements[k])propFilterForm.elements[k].value=v;});
 propFilterForm.addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(propFilterForm),p2=new URLSearchParams();
  data.forEach((v,k)=>{if(String(v).trim())p2.set(k,String(v).trim());});
  history.replaceState(null,'',location.pathname+(p2.toString()?'?'+p2.toString():''));
  renderPublicProperties();
 });
}
const liveSearch=document.querySelector('[data-live-search]');
if(liveSearch)liveSearch.addEventListener('input',()=>renderPublicProperties());
document.addEventListener('click',e=>{if(e.target.closest('[data-clear-filters]')){history.replaceState(null,'',location.pathname);if(propFilterForm)propFilterForm.reset();if(liveSearch)liveSearch.value='';renderPublicProperties();}});

/* ============================== PUBLIC: Property detail ============================== */
async function renderPropertyDetail(){
 const root=document.querySelector('[data-property-detail]');if(!root)return;
 const id=qs('id');
 let item=null;
 try{
  if(id)item=withMedia([await apiGetOne('properties',id)],'property')[0];
  if(!item){const all=await get('properties');item=all.find(p=>String(p.id)===String(id))||all[0];}
 }catch(err){
  try{const all=await get('properties');item=all[0];}catch(e2){}
 }
 if(!item){root.innerHTML='<div class="empty-state">Property not found.</div>';return;}
 document.title=item.title+' | Realty Hub';
 const bc=document.querySelector('[data-breadcrumb]');if(bc)bc.textContent='Home / Properties / '+item.title;
 const h1=document.querySelector('[data-detail-title]');if(h1)h1.textContent=item.title;
 const sub=document.querySelector('[data-detail-sub]');if(sub)sub.textContent=item.location+' · '+item.area;
 const gm=document.querySelector('[data-gallery-main]');
 const gs=document.querySelector('[data-gallery-side]');
 const gt=document.querySelector('[data-gallery-thumbs]');
 const gc=document.querySelector('[data-gallery-count]');
 const images=Array.isArray(item.images)&&item.images.length?item.images:[item.image];
 const setMainImage=(src,index)=>{
  if(gm)gm.innerHTML='<img src="'+esc(src)+'" alt="'+esc(item.title)+' photo '+(index+1)+'">';
  if(gt)gt.querySelectorAll('[data-gallery-index]').forEach(t=>t.classList.toggle('active',Number(t.dataset.galleryIndex)===index));
 };
 if(gm)setMainImage(images[0],0);
 if(gs)gs.innerHTML=images.slice(1,3).map((src,i)=>`<div class="gallery-small" data-gallery-index="${i+1}" data-swap="${esc(src)}"><img src="${esc(src)}" alt="${esc(item.title)} photo ${i+2}"></div>`).join('');
 if(gt){
  gt.innerHTML=images.map((src,i)=>`<button type="button" class="gallery-thumb${i===0?' active':''}" data-gallery-index="${i}" data-swap="${esc(src)}" aria-label="Show photo ${i+1}"><img src="${esc(src)}" alt="${esc(item.title)} thumbnail ${i+1}"></button>`).join('');
 }
 if(gc)gc.textContent=images.length+' image'+(images.length===1?'':'s');
 if(!renderPropertyDetail._galleryHandler){
  document.addEventListener('click',e=>{
   const s=e.target.closest('[data-swap]');
   if(!s)return;
   const target=s.closest('[data-gallery-index]');
   const index=target?Number(target.dataset.galleryIndex):0;
   const src=s.dataset.swap;
   const main=document.querySelector('[data-gallery-main]');
   if(main)main.innerHTML='<img src="'+esc(src)+'" alt="'+esc(document.querySelector('[data-detail-title]')?.textContent||'Property')+' photo '+(index+1)+'">';
   document.querySelectorAll('[data-gallery-thumbs] [data-gallery-index]').forEach(t=>t.classList.toggle('active',Number(t.dataset.galleryIndex)===index));
  });
  renderPropertyDetail._galleryHandler=true;
 }
 root.querySelector('[data-detail-badge]').textContent=(item.featured?'Featured · ':'')+item.status;
 root.querySelector('[data-detail-price]').textContent=item.price;
 root.querySelector('[data-detail-meta]').textContent=item.location+' · '+item.category;
 root.querySelector('[data-detail-desc]').textContent=item.description||'';
 const list=root.querySelector('[data-detail-list]');
 if(list)list.innerHTML=`<div><strong>Bedrooms</strong><span>${esc(item.bedrooms||'—')}</span></div><div><strong>Bathrooms</strong><span>${esc(item.bathrooms||'—')}</span></div><div><strong>Area</strong><span>${esc(item.area||'—')}</span></div><div><strong>Built</strong><span>${esc(item.builtYear||'—')}</span></div>`;
 const amenities=root.querySelector('[data-detail-amenities]');
 if(amenities)amenities.innerHTML=(item.amenities||'').split(',').filter(Boolean).map(a=>`<span class="badge">${esc(a.trim())}</span>`).join(' ');
 const agent=root.querySelector('[data-detail-agent]');
 if(agent)agent.innerHTML=`<strong>${esc(item.agent||'Dev Nevell Osborne')}</strong><div class="meta">${esc(item.agentRole||'Senior Property Consultant')}</div>`;
 document.querySelectorAll('[data-enquiry-form]').forEach(f=>{f.dataset.assetTitle=item.title;f.dataset.assetType='Property';});
}

/* ============================== PUBLIC: Vehicle listing + detail ============================== */
async function renderPublicVehicles(){
 const grid=document.querySelector('#public-vehicles-grid');if(!grid)return;
 let all;try{all=await get('vehicles');}catch(err){showError(err);return;}
 const form=document.querySelector('[data-vehicle-search]'),o=form?formDataObject(form):{};
 const data=all.filter(v=>v.status==='Published'&&(!o.type||v.type===o.type)&&(!o.fuel||v.fuel===o.fuel)&&(!o.transmission||(v.transmission||'').toLowerCase()===o.transmission.toLowerCase())&&(!o.year||String(v.year)===String(o.year)));
 grid.innerHTML=data.map(v=>`<article class="card">${mediaCover(v.image,v.title,'vehicle-image')}<div class="card-body">${v.featured?'<span class="badge">Featured</span>':'<span class="badge">Available</span>'}<h3>${esc(v.title)}</h3><div class="meta">${esc(v.year)} · ${esc(v.fuel)} · ${esc(v.power||'')}</div><div class="price">${esc(v.price)}</div><a class="btn btn-outline" href="vehicle-details.html?id=${encodeURIComponent(v.id)}">View Vehicle</a></div></article>`).join('')||'<div class="empty-state">No vehicles match the selected filters. Try clearing a filter.</div>';
}
const vehicleSearch=document.querySelector('[data-vehicle-search]');
if(vehicleSearch){
 const vparams=new URLSearchParams(location.search);
 vparams.forEach((v,k)=>{if(vehicleSearch.elements[k])vehicleSearch.elements[k].value=v;});
 vehicleSearch.addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(vehicleSearch),p2=new URLSearchParams();
  data.forEach((v,k)=>{if(String(v).trim())p2.set(k,String(v).trim());});
  history.replaceState(null,'',location.pathname+(p2.toString()?'?'+p2.toString():''));
  renderPublicVehicles();
 });
}

async function renderVehicleDetail(){
 const root=document.querySelector('[data-vehicle-detail]');if(!root)return;
 const id=qs('id');
 let item=null;
 try{
  if(id)item=withMedia([await apiGetOne('vehicles',id)],'vehicle')[0];
  if(!item){const all=await get('vehicles');item=all.find(v=>String(v.id)===String(id))||all[0];}
 }catch(err){
  try{const all=await get('vehicles');item=all[0];}catch(e2){}
 }
 if(!item){root.innerHTML='<div class="empty-state">Vehicle not found.</div>';return;}
 document.title=item.title+' | Realty Hub';
 const bc=document.querySelector('[data-breadcrumb]');if(bc)bc.textContent='Home / Vehicles / '+item.title;
 const h1=document.querySelector('[data-detail-title]');if(h1)h1.textContent=item.title;
 const sub=document.querySelector('[data-detail-sub]');if(sub)sub.textContent=item.year+' · '+item.fuel+' · '+(item.power||'');
 const gm=document.querySelector('[data-gallery-main]');
 const gs=document.querySelector('[data-gallery-side]');
 const gt=document.querySelector('[data-gallery-thumbs]');
 const gc=document.querySelector('[data-gallery-count]');
 const images=Array.isArray(item.images)&&item.images.length?item.images:[item.image];
 const setMainImage=(src,index)=>{
  if(gm)gm.innerHTML='<img src="'+esc(src)+'" alt="'+esc(item.title)+' photo '+(index+1)+'">';
  if(gt)gt.querySelectorAll('[data-gallery-index]').forEach(t=>t.classList.toggle('active',Number(t.dataset.galleryIndex)===index));
 };
 if(gm)setMainImage(images[0],0);
 if(gs)gs.innerHTML=images.slice(1,3).map((src,i)=>`<div class="gallery-small" data-gallery-index="${i+1}" data-swap="${esc(src)}"><img src="${esc(src)}" alt="${esc(item.title)} photo ${i+2}"></div>`).join('');
 if(gt){
  gt.innerHTML=images.map((src,i)=>`<button type="button" class="gallery-thumb${i===0?' active':''}" data-gallery-index="${i}" data-swap="${esc(src)}" aria-label="Show photo ${i+1}"><img src="${esc(src)}" alt="${esc(item.title)} thumbnail ${i+1}"></button>`).join('');
 }
 if(gc)gc.textContent=images.length+' image'+(images.length===1?'':'s');
 if(!renderVehicleDetail._galleryHandler){
  document.addEventListener('click',e=>{
   const s=e.target.closest('[data-swap]');
   if(!s)return;
   const target=s.closest('[data-gallery-index]');
   const index=target?Number(target.dataset.galleryIndex):0;
   const src=s.dataset.swap;
   const main=document.querySelector('[data-gallery-main]');
   if(!main||!document.querySelector('[data-vehicle-detail]'))return;
   main.innerHTML='<img src="'+esc(src)+'" alt="'+esc(document.querySelector('[data-detail-title]')?.textContent||'Vehicle')+' photo '+(index+1)+'">';
   document.querySelectorAll('[data-gallery-thumbs] [data-gallery-index]').forEach(t=>t.classList.toggle('active',Number(t.dataset.galleryIndex)===index));
  });
  renderVehicleDetail._galleryHandler=true;
 }
 root.querySelector('[data-detail-badge]').textContent=(item.featured?'Featured · ':'')+item.status;
 root.querySelector('[data-detail-price]').textContent=item.price;
 root.querySelector('[data-detail-meta]').textContent=item.brand+' · '+item.type+' · '+item.fuel;
 root.querySelector('[data-detail-desc]').textContent=item.specifications||'';
 const list=root.querySelector('[data-detail-list]');
 if(list)list.innerHTML=`<div><strong>Year</strong><span>${esc(item.year)}</span></div><div><strong>Fuel</strong><span>${esc(item.fuel)}</span></div><div><strong>Transmission</strong><span>${esc(item.transmission||'—')}</span></div><div><strong>Power</strong><span>${esc(item.power||'—')}</span></div>`;
 document.querySelectorAll('[data-enquiry-form]').forEach(f=>{f.dataset.assetTitle=item.title;f.dataset.assetType='Vehicle';});
}

/* ============================== PUBLIC: Blog listing + single ============================== */
async function renderPublicBlog(){
 const grid=document.querySelector('#public-blog-grid');if(!grid)return;
 let all;try{all=await get('blog');}catch(err){showError(err);return;}
 const data=all.filter(b=>b.status==='Published');
 grid.innerHTML=data.map(b=>`<article class="card"><div class="blog-thumb"><img src="${esc(b.image)}" alt="${esc(b.title)}" loading="lazy"></div><div class="card-body"><span class="badge">${esc(b.category)}</span><h3>${esc(b.title)}</h3><p class="meta">${esc(b.excerpt)}</p><div class="meta">${esc(b.author)} · ${esc(b.date)}</div><a class="text-link" href="blog-post.html?id=${encodeURIComponent(b.id)}">Read more →</a></div></article>`).join('')||'<div class="empty-state">No articles published yet.</div>';
}
async function renderBlogPost(){
 const root=document.querySelector('[data-blog-post]');if(!root)return;
 const id=qs('id');
 let item=null;
 try{
  if(id){const single=await apiGetOne('blog',id);if(single.status==='Published')item=withMedia([single],'blog')[0];}
  if(!item){const all=(await get('blog')).filter(b=>b.status==='Published');item=all.find(b=>String(b.id)===String(id))||all[0];}
 }catch(err){
  try{const all=(await get('blog')).filter(b=>b.status==='Published');item=all[0];}catch(e2){}
 }
 if(!item){root.innerHTML='<div class="empty-state">Article not found.</div>';return;}
 document.title=item.title+' | Realty Hub Journal';
 const meta=document.querySelector('meta[name=description]');if(meta)meta.setAttribute('content',item.metaDescription||item.excerpt||'');
 root.querySelector('[data-post-category]').textContent=item.category;
 root.querySelector('[data-post-title]').textContent=item.title;
 root.querySelector('[data-post-meta]').textContent=item.author+' · '+item.date;
 root.querySelector('[data-post-image]').src=item.image;
 root.querySelector('[data-post-image]').alt=item.title;
 root.querySelector('[data-post-body]').innerHTML=(item.content||'').split(/\n+/).map(p=>'<p>'+esc(p)+'</p>').join('');
}

/* Share dialog */
const shareOpen=document.querySelector('[data-share-open]'),shareModal=document.querySelector('[data-share-modal]');
if(shareOpen&&shareModal){
 shareOpen.addEventListener('click',()=>{shareModal.hidden=false;const u=encodeURIComponent(location.href),title=encodeURIComponent(document.title);
  const wa=shareModal.querySelector('[data-share-whatsapp]'),mail=shareModal.querySelector('[data-share-email]'),fb=shareModal.querySelector('[data-share-facebook]');
  if(wa)wa.href='https://wa.me/?text='+encodeURIComponent(document.title+' '+location.href);
  if(mail)mail.href='mailto:?subject='+title+'&body='+u;
  if(fb)fb.href='https://www.facebook.com/sharer/sharer.php?u='+u;
 });
 const copy=shareModal.querySelector('[data-share-copy]');if(copy)copy.addEventListener('click',async()=>{const label=copy.querySelector('span')||copy;try{await navigator.clipboard.writeText(location.href);label.textContent='Link Copied ✓';}catch(e){label.textContent='Copy not available';}});
 shareModal.addEventListener('click',e=>{if(e.target===shareModal)shareModal.hidden=true;});
}

/* initialize current page — every render*() call below is now async (it
   fetches from the Django API), so we run them all and wait before doing
   the scroll-reveal pass over whatever DOM they produced. */
initPropertyForm();
initVehicleForm();
initBlogForm();
Promise.all([
 renderProperties(),
 renderVehicles(),
 renderInquiries(),
 renderTestimonials(),
 renderBlog(),
 renderFeatured(),
 renderCategories(),
 renderDashboard(),
 renderHome(),
 renderPublicProperties(),
 renderPublicVehicles(),
 renderPropertyDetail(),
 renderVehicleDetail(),
 renderPublicBlog(),
 renderBlogPost()
]).catch(err=>console.error(err)).finally(()=>{
 /* Run scroll-reveal last, after all render*() calls above have injected
    their .reveal-io cards into the DOM. */
 initReveal();
});

function initReveal(){
 const items=document.querySelectorAll('.reveal-io');
 if(!items.length)return;
 if(!('IntersectionObserver'in window)){items.forEach(el=>el.classList.add('in-view'));return;}
 const io=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');io.unobserve(entry.target);}});
 },{threshold:.12,rootMargin:'0px 0px -40px 0px'});
 items.forEach((el,i)=>{el.style.transitionDelay=(Math.min(i%4,4)*70)+'ms';io.observe(el);});
}
})();
