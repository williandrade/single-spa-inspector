import { useState, useEffect } from "react";
import { evalCmd } from "../inspected-window.helper.js";

export default function useImportMapOverrides() {
  const [importMapsEnabled, setImportMapEnabled] = useState(false);
  const [overrides, setOverrides] = useState({});

  async function checkImportMapOverrides() {
    const hasImportMapsEnabled = await evalCmd(`(function() {
      return !!window.importMapOverrides
    })()`);
    return hasImportMapsEnabled;
  }

  async function getImportMapOverrides() {
    const { imports } = await evalCmd(`(function() {
      return window.importMapOverrides.getOverrideMap()
    })()`);
    setOverrides(imports);
  }

  async function addOverride(currentMap, currentUrl) {
    await evalCmd(`(function() {
      return window.importMapOverrides.addOverride("${currentMap}", "${currentUrl}")
    })()`);
  }

  async function removeOverride(currentMap) {
    await evalCmd(`(function() {
      return window.importMapOverrides.removeOverride("${currentMap}")
    })()`);
  }

  async function batchSetOverrides() {
    const overrideCalls = Object.entries(overrides).map(([map, url]) =>
      !url ? removeOverride(map) : addOverride(map, url)
    );
    await Promise.all(overrideCalls);
    await evalCmd(`window.location.reload()`);
  }

  // Get initial list of maps if they exist
  useEffect(() => {
    async function initImportMapsOverrides() {
      const hasImportMapsEnabled = await checkImportMapOverrides();
      if (hasImportMapsEnabled) {
        setImportMapEnabled(hasImportMapsEnabled);
        await getImportMapOverrides();
      }
    }

    initImportMapsOverrides();
  }, []);

  const setOverride = (mapping, url) => {
    const newOverrides = {
      ...overrides,
      [mapping]: url
    };
    setOverrides(newOverrides);
  };

  return {
    enabled: importMapsEnabled,
    overrides,
    setOverride,
    commitOverrides: batchSetOverrides
  };
}