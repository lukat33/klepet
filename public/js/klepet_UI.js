function divElementEnostavniTekst(sporocilo) {
  // .indexOf vrne pozicijo
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = sporocilo.indexOf(('http://' || 'https://')&&('.png'||'.jpg' ||'.gif') > -1);
  var jeVideo = sporocilo.indexOf('https://www.youtube.com/watch?v=') > -1;
  
  if(jeSlika) {
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
  if (jeVideo) {
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  else {
    return $('<div style="font-weight: bold"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajSliko(sporocilo);
  sporocilo = dodajVideo(sporocilo);

  var sistemskoSporocilo;
  var dolzinaSporocila = sporocilo.length;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  }

  else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
      // v vnosno polje napise kar mora in nastavi fokus na vnos. polje
     $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val("/zasebno \"" + $(this).text() + "\" ");
      // verzija 2
      //document.getElementById("poslji-sporocilo").value = "/zasebno...";
      $('#poslji-sporocilo').focus();
    });
    
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    $('#poslji-sporocilo').focus();
    return false;
  });

});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajSliko(vhod) {
  var slika = "";
  slikeUrl = vhod.match(new RegExp(/(http:\/\/|https:\/\/)\S+(.jpg|.png|.gif)/, 'gi'));
  if (slikeUrl != null) {
    for (var i in slikeUrl) {
      if (!(slikeUrl[i].match(/(smiley.png|kiss.png|wink.png|like.png|sad.png)/))){
        vhod += "<br>" + slikeUrl[i].replace(slikeUrl[i], ('<img src="'+ slikeUrl[i] +'" id="slika"/>'+"<br>"));
      }
    }
  }
  return vhod;
 }

function dodajVideo(vhod) {
  video = "";
  videoUrl = vhod.match(new RegExp(/(https:\/\/www\.youtube\.com\/watch\?v=\S+)/, 'gi'));
  if (videoUrl != null) {
    for (var i in videoUrl) {
      vhod += "<br>"+ videoUrl[i].replace(videoUrl[i], "<iframe src='" + videoUrl[i] + "' allowfullscreen></iframe>").replace("watch?v=", "embed/").replace("<br><img", "");
    }
  }
  return vhod;
}

socket.on('dregljaj', function() {
  $vsebina = $('#vsebina').jrumble();
     $vsebina.trigger('startRumble');
     setTimeout(function(){
       $vsebina.trigger('stopRumble');
     }, 1500);
});
