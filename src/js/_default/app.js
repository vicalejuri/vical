var rot = require("rot")
var Barba = require('barba.js');

import {GeneralTransition} from './transitions/fade';

const docStyle = document.documentElement.style;
const pointerClick = (document.ontouchstart === undefined ? "click" : "touchstart")

const PAGE_LOAD_DURATION = 650

function pageStart(){
  // Play all anims on pageStart
  requestAnimationFrame( () => {
    let els = document.querySelectorAll('.anim')
    els.forEach( (el) => el.classList.add(':play') );
  })

  requestIdleCallback( () => {
    window.unlockMail();
    fixHrefTarget(document);

    if(window.VanillaTilt) {
      let tiltedElements = document.querySelectorAll('[data-tilt]')
      Array.from(tiltedElements).map( (el) => {
        if(!el.vanillaTilt) VanillaTilt.init(el)
      })
    }
  })
}

function pageDestroy(){
  if(window.VanillaTilt){
    let tiltedElements = document.querySelectorAll('[data-tilt]')

    requestIdleCallback( () => {
      Array.from(tiltedElements).map( (el) => {
        el.vanillaTilt.destroy()
      })
    })
  }
}

/**
 * Update navigation menu to reflect URL
 */
const NavSelector = 'header > nav a'
const SelectedClass = 'selected'
const NavLinksElements = Array.from( document.querySelectorAll( NavSelector ) )
const NavLinks = NavLinksElements.map( (el) => ({'el': el, 'url': el.getAttribute('href')} ))

let NavSelected = document.querySelectorAll(`${NavSelector}.${SelectedClass}`)[0];

window.updateNavState = function(){  
  console.log("UpdateNavState")
  const pagepath = location.pathname
  const navMatched = NavLinks.filter( (nav) => (pagepath.match(nav.url)) )
  if(navMatched.length > 0 ){
    // change selected nav
    requestIdleCallback( () => {
      NavSelected.classList.remove(SelectedClass);
      NavSelected = navMatched[0].el
      NavSelected.classList.add(SelectedClass)
    })
  } else {
    console.info(`No NAV for page ${pagepath}`)
  }
}

function boot() {
  requestIdleCallback( () => {
    scrollListener()
  })

  requestAnimationFrame( () => {
    // Page transition loader
    Barba.Pjax.Dom.wrapperId = 'page-trans-wrapper';
    Barba.Pjax.Dom.containerClass = 'page-container';

    Barba.Pjax.getTransition = () => (GeneralTransition('page-in','page-out', PAGE_LOAD_DURATION ));
    Barba.Pjax.start();
  })

  /* Get relative address of page */
  var address = location.href.split("/")
                        .filter((t) => { return (t != "" && t != "http:") })
                        .splice(1, 10).join("/")

  document.dispatchEvent( new Event('page-in') );                  
}


/*
 * Listen to scroll-y, update css --scrolly variable
 */
function scrollListener() {
  /* add passive listener
  const scrollHandler = document.addEventListener("scroll", (ev) => {
    docStyle.setProperty("--scrolly", document.body.scrollTop)
  }, {passive: true})
  */
}


/**
 * fixHrefTarget
 *  Mimics :target behaviour using class toggling.
 *  in CSS use :is-target, instead of :target
 */
function fixHrefTarget(container, tgtClass = ":is-target") {
  const linksWithHash = container.querySelectorAll('a[href^="#"]')
  let target = undefined

  function add(tgt, klass) { tgt.classList.add(klass) }
  function rm(tgt, klass) { tgt.classList.remove(klass) }

  linksWithHash.forEach((link) => {
    link.addEventListener(pointerClick, function(e) {
      e.preventDefault()

      // set new target
      var newTgt = this.getAttribute("href")
      if (newTgt != "#") {
        target = container.querySelector(newTgt)

        // remove or add new class
        if(target.classList.contains(tgtClass)) rm(target, tgtClass)
        else add(target, tgtClass)
      }
    })
  })
}

/**
 * Add class .in / out based on 'hover' of element
 */
function hoverInOut(container, selector = "hoverable", timeout = 5000) {
  var hoveredEls = container.querySelectorAll(selector)
  hoveredEls.forEach((el) => {
    let is_hovered = false;
    el.addEventListener("mouseover", (ev) => {
      is_hovered = true;
      el.classList.remove("out")
      el.classList.add("in")
    })
    el.addEventListener("mouseout", (ev) => {
      is_hovered = false;
      el.classList.add("out")
      el.classList.remove("in")
    })
  })
}


/**
 * Ceasar cryptography to avoid spammers reading my mail address
 *
 * Acts on:
 * Links with peculiarity['link-encrypted'] and data property
 * All elements with class [ .ceasar .says ]
 */
function unlockMail() {

  /* Links */
  const links = document.querySelectorAll('a[peculiarity="link-encrypted"]')
  links.forEach((el) => {
    var mailEncrypted = el.getAttribute("data");
    var mailPlaintext = rot(mailEncrypted, -12);

    requestAnimationFrame(() => {
      el.href = mailPlaintext;
    })
  })

  /* Plain txt */
  const txts = document.querySelectorAll(".ceasar.says")
  txts.forEach((el) => {
    var encrypted = el.innerHTML
    var plaintext = rot(encrypted, -12);
    requestAnimationFrame(() => {
      el.innerHTML = plaintext;
      el.classList.remove('says');
    })
  })

}
/* Export */
window.unlockMail = unlockMail;

document.addEventListener("DOMContentLoaded", boot)
document.addEventListener('page-in', pageStart);
document.addEventListener('page-out', pageDestroy);