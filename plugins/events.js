export default defineNuxtPlugin((nuxtApp) => {
  // Note: This plugin may need store access which will require Pinia migration
  // For now, commenting out store-dependent code to prevent errors

  window.addEventListener("resize", function () {
    // TODO: Update this to use Pinia store when store is migrated
    // store.commit('system/setViewport', {
    //   width: window.innerWidth,
    //   height: window.innerHeight
    // })
  });
  window.dispatchEvent(new Event("resize"));

  // It's going to be faster to operate on our local variable.
  var scrollTop = 0;
  let observe = () => {
    let unroundedPos = window.pageYOffset || document.documentElement.scrollTop;
    let pos = Math.round(100 * unroundedPos) / 100;
    if (scrollTop !== pos) {
      scrollTop = pos;
      // TODO: Update this to use Pinia store when store is migrated
      // store.commit('system/setScroll', {
      //   top: scrollTop
      // })
    }
    window.requestAnimationFrame(observe);
  };
  window.requestAnimationFrame(observe);

  // check YT API status
  // TODO: Update this to use Pinia store when store is migrated
  // window.addEventListener('youtubeLoaded', () => store.commit('youtubeLoaded', true))
  // if (window.ytReady) { store.commit('youtubeLoaded', true) }
});
