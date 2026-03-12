<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(128, 128, 128, 0.5) transparent;
}

*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(128, 128, 128, 0.5);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(128, 128, 128, 0.7);
  border: 2px solid transparent;
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:active {
  background-color: rgba(128, 128, 128, 0.9);
  border: 2px solid transparent;
  background-clip: padding-box;
}

body.body--dark *::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
}

body.body--dark *::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

body.body--dark *::-webkit-scrollbar-thumb:active {
  background-color: rgba(255, 255, 255, 0.7);
}

body.body--dark * {
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

body .q-menu.planner__select-menu {
  z-index: 99999 !important;
}
</style>
