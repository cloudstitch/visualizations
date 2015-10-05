module.exports = function(root, data) {
};

window.themeBlur = function() {
  var theme = document.getElementById('themeSel').value;
  document.getElementById('main_container').classList.remove('theme_light');
  document.getElementById('main_container').classList.remove('theme_dark');
  document.getElementById('main_container').classList.remove('theme_ncaa');
  document.getElementById('main_container').classList.add(theme);
}

window.sizeBlur = function() {
  var size = document.getElementById('sizeSel').value;
  document.getElementById('main_wrapper').classList.remove('bracket_1');
  document.getElementById('main_wrapper').classList.remove('bracket_2');
  document.getElementById('main_wrapper').classList.add(size);
}