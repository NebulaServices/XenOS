if (!("xen" in window)) {
  throw new Error("Unable to find Xen context.");
}

const { parent } = xen;
let apps;
let featured_app;

parent.on("setApps", (_apps) => {
  apps = _apps.map(e=>Object.values(e)[0]);
  updateContent();
});

parent.on("setFeaturedApp", (_featured_app) => {
  featured_app = _featured_app;
  updateContent();
});

function updateContent() {
  if (!apps || !featured_app) return;

  console.log(apps, featured_app)

  // Update featured section
  document.querySelector("#featuredTitle").innerText = featured_app.name;
  document.querySelector("#featuredDescription").innerText = featured_app.description;
  document.querySelector("#featuredInstallButton").innerHTML = generateFeaturedInstallButton(featured_app);
  var featuredButton = document.querySelector('#featuredInstall');
  document.querySelector('#featuredInstall').id = featured_app.id;
  document.querySelector('#featuredBackground').style.backgroundImage = `url("https://xenos-app-repository.enderkingj.repl.co${xen.modules.path.join(`/cover/`, featured_app.id)}")`;
  document.querySelector('#featuredBackground').style.backgroundSize = "100%";
  document.querySelector('#featuredBackground').classList.remove('animate-pulse');

  if (apps.find(e=>e.id==featured_app.id)) {
    featuredButton.dataset.role = 'uninstall';
    featuredButton.innerText = 'Uninstall';
    featuredButton.classList.remove('bg-blue-500');
    featuredButton.classList.add('bg-neutral-500');
  } else {
    featuredButton.dataset.role = 'install';
    featuredButton.innerText = 'Install';
    featuredButton.classList.remove('bg-neutral-500');
    featuredButton.classList.add('bg-blue-500');
  };
  
  // Populate explore section
  const exploreContainer = document.querySelector("#exploreContainer");
  exploreContainer.innerHTML = "";
  const cards = apps.map((app) => {
    return createHTMLElement(generateExploreCard(app));
  });
  for (const card of cards) {
    console.log(card);
    exploreContainer.appendChild(card);
  }

  // Bind events
  for (const installButton of document.querySelectorAll("[data-role='install']")) {
    installButton.onclick = () => {
      parent.send("install", installButton.id);
      installButton.disabled = true;
    }
  }
  for (const uninstallButton of document.querySelectorAll("[data-role='uninstall']")) {
    uninstallButton.onclick = () => {
      parent.send("uninstall", uninstallButton.id);
      uninstallButton.disabled = true;
    }
  }
}

// Install callbacks
parent.on("installSuccess", (appId) => {
  apps = apps.map((app) => {
    if (app.id === appId) {
      app.isInstalled = true;
    }
    return app;
  });
  
  parent.send('getApps');
});

parent.on("installFail", (appId) => {
  updateContent();
  throw new Error(`Unable to install '${appId}'`);
});

parent.on("uninstallSuccess", (appId) => {
  apps = apps.map((app) => {
    if (app.id === appId) {
      app.isInstalled = false;
    }
    return app;
  });
  
  parent.send('getApps');
});

parent.on("uninstallFail", (appId) => {
  updateContent();
  throw new Error(`Unable to uninstall '${appId}'`);
});

function createHTMLElement(htmlAsString) {
  const div = document.createElement("div");
  div.innerHTML = htmlAsString;
  return div;
}

function generateExploreCard(app) {
  return `
    <div
      class="w-full aspect-square rounded-md overflow-hidden shadow-lg flex flex-col"
    >
      <div class="w-full flex-1 bg-neutral-800 animate-pulse">
        
      </div>
      <div class="w-full h-[1/4] bg-neutral-800 p-5 flex">
        <div>
          <h2 class="text-2xl font-bold mb-2">${app.name}</h2>
          <p>${app.description}</p>
        </div>
        <div class="flex justify-end items-start flex-1">
          ${generateExploreInstallButton(app)}
        </div>
      </div>
    </div>
  `;
}

function generateFeaturedInstallButton(app) {
  if (app.isInstalled) {
    return `
      <div
        id="featuredInstall"
        data-role="install"
        id="${app.id}"
        class="bg-neutral-400 py-4 px-12 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-all"
      >
        Uninstall
      </div>
    `;
  } else {
    return `
      <div
        id="featuredInstall"
        data-role="install"
        class="bg-blue-500 py-4 px-12 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-all"
      >
        Install
      </div>
    `;
  }
}

function generateExploreInstallButton(app) {
  if (app.isInstalled) {
    return `
      <div
        id="${app.id}"
        data-role="install"
        class="bg-blue-500 py-1 px-4 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-all text-sm"
      >
        Install
      </div>
    `;
  } else {
    return `
      <div
        id="${app.id}"
        data-role="uninstall"
        class="bg-neutral-400 py-1 px-4 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-all text-sm"
      >
        Uninstall
      </div>
    `;
  }
}