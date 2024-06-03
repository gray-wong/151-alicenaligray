//==============================================================================
// dataserver.js - worksheets + load of datasets and rulesets from server files//==============================================================================
//==============================================================================
// global variables//==============================================================================

lambda = [];
library = [];
datasets = {};
rulesets = {};

//==============================================================================
// initialize//==============================================================================

function initialize ()
 {parameters = getparameters();

  definefacts(lambda,readdata(document.getElementById('lambda').value));
  var widgets = document.getElementsByTagName('dataset');
  for (var i=0; i<widgets.length; i++)
      {var source = widgets[i].getAttribute('src');
       var target = widgets[i].id;
       var facts = readdata(widgets[i].textContent);
       if (source) {facts = facts.concat(getdata(source))};
       if (target) {var theory = getdataset(target)} else {var theory = lambda};
       definemorefacts(theory,facts)};

  definerules(library,readdata(document.getElementById('library').value));
  var widgets = document.getElementsByTagName('ruleset');
  for (var i=0; i<widgets.length; i++)
      {var source = widgets[i].getAttribute('src');
       var target = widgets[i].id;
       var rules = readdata(widgets[i].textContent);
       if (source) {rules = rules.concat(getdata(source))};
       if (target) {var theory = getruleset(target)} else {var theory = library};
       definemorerules(theory,rules)};

  fullreact('load');
  return true}

function getdataset (target)
 {if (datasets[target]===undefined) {datasets[target] = []};
  return datasets[target]}

function getruleset (target)
 {if (datasets[target]===undefined) {datasets[target] = []};
  return datasets[target]}

//==============================================================================

function getdata (source)
 {return readdata(posteval(source))}

function putdata (facts)
 {return posteval("savedata.php",grindem(facts))}

function geteval (url)
 {request = new XMLHttpRequest();
  request.overrideMimeType('text/plain');
  request.open('GET',url,false);
  request.send();
  return request.responseText}

function puteval (url,data)
 {request = new XMLHttpRequest();
  request.overrideMimeType('text/plain');
  request.open('PUT',url,false);
  request.send(data);
  return request.responseText}

function posteval (url,data)
 {request = new XMLHttpRequest();
  request.overrideMimeType('text/plain');
  request.open('POST',url,false);
  request.send(data);
  return request.responseText}

//==============================================================================
//==============================================================================
//==============================================================================
