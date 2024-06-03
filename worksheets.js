//==============================================================================
// worksheets.js//==============================================================================
// Copyright (c) 2021 The Board of Trustees of the Leland Stanford Junior
// University.  All nonprofit research institutions may use this Software for
// any non-profit purpose, including sponsored research and collaboration.  All
// nonprofit research institutions may publish any information included in the
// Software.  This Software may not be redistributed.  It may not be used for
// commercial purposes.  For any questions regarding commercial use or
// redistribution, please contact the Office of Technology Licensing at Stanford
// University (info@otlmail.stanford.edu).
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS";
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//==============================================================================
//==============================================================================
// global variables//==============================================================================

indexing = true
dataindexing = true
ruleindexing = true

var lambda = [];
var library = [];

var user = 'anonymous';
var parameters = {};
var datasets = [];
var channels = [];

//==============================================================================
// initialize//==============================================================================

function initialize ()
 {parameters = getparameters();

  var widget = document.getElementById('library');  
  library = [];
  definemorerules(library,readdata(widget.textContent));

  widget = document.getElementById('lambda');
  definefacts(lambda,readdata(widget.textContent));

  var widgets = document.getElementsByTagName('dataset');
  for (var i=0; i<widgets.length; i++)
      {var theory = [];
       definefacts(theory,readdata(widgets[i].textContent));
       datasets[widgets[i].id] = theory};

  widgets = document.getElementsByTagName('channel');
  for (var i=0; i<widgets.length; i++)
      {channels[widgets[i].id] = readdata(widgets[i].textContent)};

  fullreact('load');
  return true}

//------------------------------------------------------------------------------

function getparameters ()
 {var parts = location.href.split("?");
  if (parts.length<=1) {return {}};
  var pairs = parts[1].split('&');
  var params = {};
  for (var i=0; i<pairs.length; i++)
      {var args = pairs[i].split('=');
       if (args.length===2 && args[0].length>0 && args[1].length>0)
          {var attr = read(args[0]);
           var value = read(args[1]);
           params[attr] = value}};
  return params}

//==============================================================================
// inputs
//==============================================================================

function handle (widget)
 {if (widget.type==='text' & widget.hasAttribute('autoquote'))
     {return modstring(widget)};
  if (widget.type==='text') {return modtext(widget)};
  if (widget.type==='textarea') {return modstring(widget)};
  if (widget.type==='range') {return modtext(widget)};
  if (widget.type==='select-one') {return modselector(widget)};
  if (widget.type==='select-multiple') {return modmultiselector(widget)};
  if (widget.type==='radio') {return modradio(widget)};
  if (widget.type==='checkbox')  {return modcheck(widget)};
  return modbutton(widget)}

//------------------------------------------------------------------------------
// mod
//------------------------------------------------------------------------------

function modtext (widget)
 {var item = read(widget.id);
  var value = read(widget.value.toLowerCase());
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modstring (widget)
 {var item = read(widget.id);
  var value = quotify(widget.value.replace(/"/g,"'"));
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modselector (widget)
 {var item = read(widget.id);
  var value = read(widget.value);
  var action = seq('select',item,value);
  fullreact(action);
  return true}

function modmultiselector (widget)
 {var item = read(widget.id);
  var options = widget.options;
  var values = nil;
  for (var i=widget.options.length-1; i>=0; i--)
      {if (options[i].selected)
          {values = seq('cons',options[i].value,values)}};
  fullreact(seq('multiselect',item,values));
  return true}

function modmenu (widget)
 {var item = read(widget.parentNode.id);
  var value = read(widget.value);
  if (widget.selected)
     {var action = seq('select',item,value);
      fullreact(action)}
     else {var action = seq('deselect',item,value);
           fullreact(action)};
  return true}

function modradio (widget)
 {var item = read(widget.name);
  var value = read(widget.value);
  fullreact(seq('select',item,value));
  return true}

function modcheck (widget)
 {var item = read(widget.id);
  var value = widget.checked ? 'true' : 'false';
  fullreact(seq('select',item,value));
  return true}

function modbutton (widget)
 {return fullreact(seq('click',read(widget.id)))}

function modsubmit (widget)
 {fullreact(seq('click',read(widget.id)));
  return widget.form.submit()}

//------------------------------------------------------------------------------
// timer
//------------------------------------------------------------------------------

var ticker = false;

function dostep ()
 {return fullreact('tick')}

function doplay ()
 {document.getElementById('stepper').disabled = true;
  document.getElementById('player').disabled = true;
  document.getElementById('pauser').disabled = false;
  document.getElementById('stepper').style.backgroundColor = '#efefef';
  document.getElementById('player').style.backgroundColor = '#efefef';
  document.getElementById('pauser').style.backgroundColor = '#ffffff';
  run();
  return true}

function dopause ()
 {document.getElementById('stepper').disabled = false;
  document.getElementById('player').disabled = false;
  document.getElementById('pauser').disabled = true;
  document.getElementById('stepper').style.backgroundColor = '#ffffff';
  document.getElementById('player').style.backgroundColor = '#ffffff';
  document.getElementById('pauser').style.backgroundColor = '#efefef';
  if (ticker) {clearTimeout(ticker); ticker = false};
  return true}

function run()
 {fullreact('tick');
  var tickinterval = compfindx("X",seq("tickinterval","X"),lambda,library);
  var interval = parseFloat(tickinterval || 500);
  ticker = setTimeout(run,interval);
  return true}

//==============================================================================
// fullreact
//==============================================================================

exportables = ['setvalue','setvaluelist','setattribute','setstyle',
               'setrows','setoptions','setinnerhtml','populatesheet',
               'alert','message'];

function fullreact (event)
 {var deltas = compexecute(event,lambda,library);
  populatesheet();
  for (var i=0; i<deltas.length; i++) {execute(deltas[i])};
  return true}

//==============================================================================
// Output
//==============================================================================
//------------------------------------------------------------------------------
// populatesheet
//------------------------------------------------------------------------------

var populators = [];

function populatesheet ()
 {populateinnerhtmls();
  populatetables();
  populateoptions();
  populatevalues();
  populatevaluelists();
  populateattributes();
  populatestyles();
  for (var i=0;i<populators.length; i++) {populators[i].call(null)};
  reposition();
  return true}

function populateinnerhtmls ()
 {var pattern = seq('innerhtml','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {saveinnerhtml(data[i])}
  return true}

function populatetables ()
 {var pattern = seq('rows','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {saverows(data[i])}
  return true}

function populateoptions ()
 {var pattern = seq('options','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {saveoptions(data[i])}
  return true}

function populatevalues ()
 {var pattern = seq('value','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {savevalue(data[i])}
  return true}

function populatevaluelists ()
 {var pattern = seq('valuelist','X','Y');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {savevaluelist(data[i])}
  return true}

function populateattributes ()
 {var pattern = seq('attribute','X','Y','Z');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {saveattribute(data[i])}
  return true}

function populatestyles ()
 {var pattern = seq('style','X','Y','Z');
  var data = compfinds(pattern,pattern,lambda,library);
  for (var i=0; i<data.length; i++)
      {savestyle(data[i])}
  return true}

//------------------------------------------------------------------------------
// execute
//------------------------------------------------------------------------------

function execute (action)
 {if (symbolp(action)) {return enqueue(action)};
  if (action[0]==='setvalue') {return savevalue(action)};
  if (action[0]==='setvaluelist') {return savevaluelist(action)};
  if (action[0]==='setattribute') {return saveattribute(action)};
  if (action[0]==='setstyle') {return savestyle(action)};
  if (action[0]==='setrows') {return saverows(action)};
  if (action[0]==='setoptions') {return saveoptions(action)};
  if (action[0]==='setinnerhtml') {return saveinnerhtml(action)};
  if (action[0]==='alert') {return alert(action[1])};
  if (action[0]==='message') {return savemessage(action[1])};
  return enqueue(action)}

//------------------------------------------------------------------------------
// Cases
//------------------------------------------------------------------------------

function savevalue (datum)
 {var widget = getwidget(grind(datum[1]));
  if (!widget) {return false}
  if (widget.type==='hidden') {return savehidden(datum)};
  if (widget.type==='text' & widget.hasAttribute('autoquote'))
     {return savestring(datum)};
  if (widget.type==='text') {return savetext(datum)};
  if (widget.type==='textarea') {return savetextarea(datum)};
  if (widget.type==='range') {return saverange(datum)};
  if (widget.type==='select-one') {return saveselection(datum)};
  if (widget.type==='select-multiple')
     {return savevaluelist(seq('valuelist',datum[1],seq('cons',datum[2],nil)))};
  if (widget.type==='radio') {return saveradio(datum)};
  if (widget.type==='checkbox') {return savecheck(datum)};
  return false}

function getwidget (label)
 {var widget = document.getElementById(label);
  if (widget) {return widget};
  var widgets = document.getElementsByName(label);
  if (widgets.length>0) {return widgets[0]}; 
  return false}

function savehidden (datum)
 {var widget = document.getElementById(grind(datum[1]));
  widget.value = grind(datum[2]);
  return true}

function savetext (datum)
 {var widget = document.getElementById(grind(datum[1]));
  var value = grind(datum[2]);
  if (document.activeElement!==widget) {widget.value = value};
  return true}

function savestring (datum)
 {var widget = document.getElementById(grind(datum[1]));
  var value = stripquotes(grind(datum[2]));
  if (document.activeElement!==widget) {widget.value = value};
  return true}

function savetextarea (datum)
 {var widget = document.getElementById(grind(datum[1]));
  var value = stripquotes(grind(datum[2]));
  if (document.activeElement!==widget) {widget.value = value};
  return true}

function saverange (datum)
 {var widget = document.getElementById(grind(datum[1]));
  widget.value = grind(datum[2]);
  return true}

function saveselection (datum)
 {var widget = document.getElementById(grind(datum[1]));
  var value = grind(datum[2]);
  var flag = false;
  for (var i=0; i<widget.options.length; i++)
      {if (widget.options[i].value===value)
          {flag = true; widget.options[i].selected = true; break}};
  if (!flag) {widget.selectedIndex = -1};
  return true}

function savecheck (datum)
 {var widget = document.getElementById(grind(datum[1]));
  if (datum[2]==='true') {widget.checked = true} else {widget.checked = false};
  return true};

function saveradio (datum)
 {var options = document.getElementsByName(grind(datum[1]));
  var value = grind(datum[2]);
  for (var i = 0; i<options.length; i++)
      {if (options[i].value===value) {options[i].checked = true; return true}};
  return false};

//------------------------------------------------------------------------------

function savevaluelist (datum)
 {var widget = getwidget(grind(datum[1]));
  if (widget.type!=='select-multiple') {return false};
  var values = [];
  for (var data=datum[2]; data!=='nil'; data=data[2])
      {values.push(grind(data[1]))};
  for (var i=0; i<widget.options.length; i++)
      {widget.options[i].selected = findq(widget.options[i].value,values)};
  return true}

//------------------------------------------------------------------------------

function saveattribute (datum)
 {var widget = document.getElementById(grind(datum[1]));
  if (!widget) {return false};
  var property = stripquotes(datum[2]);
  var val = stripquotes(datum[3]);
  if (property==='disabled' && val==='false')
     {widget.disabled = false}
     else if (property==='readonly' && val==='false')
             {widget.removeAttribute('readonly')}
     else {widget.setAttribute(property,val)};
  return true}

//------------------------------------------------------------------------------

function savestyle (datum)
 {var widget = document.getElementById(grind(datum[1]));
  if (!widget) {return false};
  var property = stripquotes(datum[2]);
  var style = stripquotes(datum[3]);
  widget.style[property] = style;
  return true}

//------------------------------------------------------------------------------

function saverows (datum)
 {var widget = document.getElementById(grind(datum[1]));
  if (!widget) {return false};
  var styles = getstyles(widget);
  var bodies = widget.tBodies;
  if (bodies.length===0)
     {widget.appendChild(document.createElement('tbody'));
      bodies = widget.tBodies};
  var body = bodies[0];
  while (body.rows.length>0) {body.deleteRow(0)};
  for (var data=datum[2]; data!=='nil'; data=data[2])
      {var row = body.insertRow(body.rows.length);
       for (var j=0; j<styles.length; j++)
           {var cell = row.insertCell(j);
            cell.innerHTML = display(data[1][j+1],styles[j])}};
  return true}

function getstyles (widget,arity)
 {var styles = [];
  var head = widget.tHead;
  if (head===null) {return new Array(arity).fill(null)};
  var cells = head.rows[0].cells;
  for (var j=0; j<cells.length; j++)
      {styles.push(cells[j].getAttribute('displaystyle'))};
  return styles}

function display (x,style)
 {if (style===null) {return grind(x)}
  if (style==='stringfield') {return stripquotes(x)};
  var xs = compfindx('Out',seq(style,x,'Out'),lambda,library);
  if (xs) {return stripquotes(xs)};
  return grind(x)}

function getarity (relation)
 {var data = indexees(relation,lambda);
  for (var i=0; i<data.length; i++)      {if (data[i][0]===relation) {return data[i].length-1}};  return getrulearity(relation,library)}

//------------------------------------------------------------------------------

function saveoptions (datum)
 {var widget = document.getElementById(grind(datum[1]));
  if (!widget) {return false};
  while (widget.options.length>1) {widget.remove(1)};
  for (var data=datum[2]; data!=='nil'; data=data[2])
     {var option = document.createElement('option');
      var value = grind(data[1]);
      option.value = value;
      option.text = stripquotes(value);
      if (widget.multiple)
         {option.name = id;
          option.onclick = 'modmenu(this)'};
      widget.add(option)};
  return true}

//------------------------------------------------------------------------------

function saveinnerhtml (datum)
 {var widget = document.getElementById(grind(datum[1]));
  if (!widget) {return false};
  var value = stripquotes(datum[2]);
  widget.innerHTML = value;
  return true}

//------------------------------------------------------------------------------

function savemessage (msg)
 {var widget = document.getElementById(msg[2]);
  if (!widget) {return false};
  var source = widget.getAttribute('src');
  if (source && widget.getAttribute('direction')==='outbound')
     {channels[msg[2]].push(msg[1]); return true};
  enqueue(msg);
  return true}

//------------------------------------------------------------------------------

function enqueue (event)
 {//console.log('Queuing: ' + event);
  setTimeout(function () {fullreact(event)},0);
  return true};

//------------------------------------------------------------------------------
//reposition
// xoffset, yoffset: numeric, {left, center, right}, {top, center, bottom};
// xref, yref: ids
//------------------------------------------------------------------------------

function reposition ()
 {var a = document.querySelectorAll("[yref],[xref],[xoffset],[yoffset]");
  var all = [];
  for (var i=0; i<a.length; i++) {all.push(a[i])};
  for (var i=0; i<all.length; i++) {all[i].removeAttribute("positioned")};
  for (var i=0; i<all.length; i++)
      {if (!all[i].getAttribute("positioned")) {position(all[i])}};
  return true}

function position (w)
 {var xref = document.getElementById(w.getAttribute("xref")||"");
  var xoffset = w.getAttribute("xoffset");
  var yref = document.getElementById(w.getAttribute("yref")||"");
  var yoffset = w.getAttribute("yoffset");

  var left = 0, top = 0;

  var grp = closestgroup(w.parentNode);
  if (grp)
     {if (!grp.getAttribute("positioned")) position(grp);
      var lt = getlefttop(grp);
      left = parseFloat(lt[0]), top = parseFloat(lt[1])}

  if (xref && isrelative(xref) && !xref.getAttribute("positioned"))
		position(xref);
  if (yref && isrelative(yref) && !yref.getAttribute("positioned"))
		position(yref);

  var em = document.querySelector("._main")? document.querySelector("._main"): document.body;

  if (!xoffset)
		xoffset = xref? 0: parseFloat(w.getAttribute("data-x") || 0);
	else if (xoffset == "left")
		xoffset = -1 * parseFloat(getComputedStyle(w).width);
	else if (xoffset == "right")
		xoffset = xref? parseFloat(getComputedStyle(xref).width): parseFloat(w.getAttribute("data-x") || 0);
	else if (xoffset == "center")
		xoffset = ((xref? parseFloat(getComputedStyle(xref).width): parseFloat(em.scrollWidth)) - parseFloat(getComputedStyle(w).width)) / 2;
	else 
		xoffset = xoffset.length && !isNaN(xoffset)? xoffset: parseFloat(w.getAttribute("data-x") || 0);

  if (!yoffset)
		yoffset = yref? 0: parseFloat(w.getAttribute("data-y") || 0);
	else if (yoffset == "top")
		yoffset = -1 * parseFloat(getComputedStyle(w).height);
	else if (yoffset == "bottom")
		yoffset = yref? parseFloat(getComputedStyle(yref).height): parseFloat(w.getAttribute("data-y") || 0);
	else if (yoffset == "center")
		yoffset = ((yref? parseFloat(getComputedStyle(yref).height): parseFloat(em.scrollHeight)) - parseFloat(getComputedStyle(w).height)) / 2;
	else 
		yoffset = yoffset.length && !isNaN(yoffset)? yoffset: parseFloat(w.getAttribute("data-y") || 0);

  var x, y;
  var yo = document.querySelector("._main")? 24: 0;

  if (xref)
		x = getAbsoluteBoundingRect(xref).left + parseFloat(xoffset) - left;//xref.getBoundingClientRect().left + parseFloat(xoffset);
	else x = /*parseFloat(w.getAttribute("data-x") || 0) + */parseFloat(xoffset);
  if (yref)
		y = getAbsoluteBoundingRect(yref).top + parseFloat(yoffset) - yo - top;//yref.getBoundingClientRect().top + parseFloat(yoffset) - 24;
	else y = /*parseFloat(w.getAttribute("data-y") || 0) + */parseFloat(yoffset);

  w.setAttribute("data-x",x);
  w.setAttribute("data-y",y);

  var transform = w.style["transform"] || w.style["-webkit-transform"] || w.style["-moz-transform"] || "";
    
  var prev = transform;
  var translate = "translate(" + x + "px," + y + "px)";  
  if (transform.match(/translate\([^)]+\)/g))
     transform = transform.replace(/translate\([^)]+\)/g,translate);
      else
        transform = translate + " " + transform;
   	w.style["-moz-transform"] = w.style["-webkit-transform"] = w.style["transform"] = transform;
   	w.setAttribute("positioned",true)}

function closestgroup (w)
 {if (w.nodeName == "BODY") {return null}
     else if (w.getAttribute("widget") && w.getAttribute("widget") == "group")
          {return w}
     else {return closestgroup(w.parentNode)}}

function isrelative (w)
 {return w.getAttribute("xref") || w.getAttribute("yref") || false}

function getlefttop (w)
 {var x = parseFloat(w.getAttribute("data-x")||0);
  var y = parseFloat(w.getAttribute("data-y")||0);
  var g = closestgroup(w.parentNode);
  if (!g) {return [x,y]};
  var a = getlefttop(g);
  return [a[0] + x,a[1] + y]}

function getAbsoluteBoundingRect (el) 
 {var doc  = document,
        win  = window,
        body = doc.body,

        // pageXOffset and pageYOffset work everywhere except IE <9.

        offsetX = win.pageXOffset !== undefined ? win.pageXOffset :
            (doc.documentElement || body.parentNode || body).scrollLeft,
        offsetY = win.pageYOffset !== undefined ? win.pageYOffset :
            (doc.documentElement || body.parentNode || body).scrollTop,

        rect = el.getBoundingClientRect();

    if (el !== body) 
       {var parent = el.parentNode;

        // The element's rect will be affected by the scroll positions of
        // *all* of its scrollable parents, not just the window, so we have
        // to walk up the tree and collect every scroll offset. Good times.

        while (parent !== body && parent !== null) 
         {offsetX += parent.scrollLeft;
          offsetY += parent.scrollTop;
          parent   = parent.parentNode}}

    return {bottom: rect.bottom + offsetY,
            height: rect.height,
            left  : rect.left + offsetX,
            right : rect.right + offsetX,
            top   : rect.top + offsetY,
            width : rect.width}}

window.onresize = function() {reposition()};

//==============================================================================
// File system
//==============================================================================

function dosavefile()
 {var filename = prompt("Enter File Name.  (if Automatic Downloads are enabled, then the file will appear in the downloads directoyr as per your browser's settings.)");
  if (!filename) {return false};
  if (filename.length===0)
     {alert('Error: no file name was specified.'); return false};
  return savefile(filename,grindem(lambda))}
 
function savefile(filename, data)
 {//works for IE 10, Edge 12, Firefox 4, Chrome 8, Safari 6, Opera 15
  var blob = new Blob([data], {type: 'plain/text'});
  if (window.navigator.msSaveOrOpenBlob) 
     {return window.navigator.msSaveBlob(blob,filename)};
  var elem = window.document.createElement('a');
  elem.href = window.URL.createObjectURL(blob);
  elem.download = filename;        
  document.body.appendChild(elem);
  elem.click();        
  document.body.removeChild(elem);
  return true}

//------------------------------------------------------------------------------

function doloadfile ()
 {var widget = document.getElementById('file');
  widget.value = null;
  widget.click();
  return true}

function fileselect (e) 
 {if (!(window.File && window.FileReader && window.FileList && window.Blob))
     {alert('The File APIs are not fully supported in this browser.');
      return}
  var files = e.target.files;
  var output = [], f;
  for (var i = 0; f = files[i]; i++)
      {var reader = new FileReader();
       reader.onload = function(fe)
        {var content = fe.target.result;
         definefacts(lambda,readdata(content));
         populatesheet()};
       reader.readAsText(f)}
  return true}

//==============================================================================
// epilog builtins
//==============================================================================

builtins.push("parameter");

function parameter (attr)
 {var value = parameters[attr];
  if (value) {return value};
  return false}


builtins.push("source");

function source (dataset)
 {var widget = document.getElementById(dataset);
  var source = widget.getAttribute('src');
  if (source) {return source};
  return false}


builtins.push("dayofweek");

function dayofweek (timestamp)
 {timestamp = numberize(timestamp);
  var d = new Date(timestamp);
  return stringize(d.getDay())}


builtins.push("timestamp");

function timestamp ()
 {return stringize(Date.now())}


builtins.push("totimestamp");

function totimestamp (date)
 {date = stripquotes(date);
  var d = new Date(date);
  return stringize(d.getTime())} 


builtins.push("formattimestamp");

function formattimestamp (timestamp)
 {timestamp = numberize(timestamp);
  var d = new Date(timestamp);
  var year = d.getFullYear(), month = d.getMonth(), day = d.getDate(), hour = d.getHours(), min = d.getMinutes(), sec = d.getSeconds();
  return seq('time',stringize(year),
                   stringize(month > 9? month: "0" + month),
                   stringize(day > 9? day: "0" + day),
                   stringize(hour > 9? hour: "0" + hour),
                   stringize(min > 9? min: "0" + min),
                   stringize(sec > 9? sec: "0" + sec))}

//==============================================================================
//==============================================================================
//==============================================================================
