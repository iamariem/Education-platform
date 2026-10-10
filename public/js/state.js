
const appState = {
  user: null,
  language: "en",
  theme: "light",
  notifications: [],
};

const stateListeners = new Set();

function getState() {
  return { ...appState };
}

function setState(updates) {
  Object.assign(appState, updates);

  stateListeners.forEach((listener) => {
    listener(getState());
  });
}

function subscribeToState(listener) {
  stateListeners.add(listener);

  return () => {
    stateListeners.delete(listener);
  };
}
