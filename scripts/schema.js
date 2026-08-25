//@ts-check
/**
 * Builder helpers that expand a compact function/extension description into
 * the full, verbose JSON shape GDevelop's "Events Function Extension"
 * format requires. Nothing here changes what ships to the GDevelop editor -
 * the output is byte-for-byte the same schema you'd get hand-writing it or
 * building it in the visual editor. This just removes the boilerplate from
 * the *authoring* side.
 *
 * See ../README.md for the full picture (tiers, when to use this vs a
 * hand-authored JSON, container shapes).
 */

/**
 * @typedef {Object} ParamDef
 * @property {string} name
 * @property {string} type - "string" | "expression" | "objectList" | "object" | "behavior" | "scenevar" | "variable" | "yesorno" | "trueorfalse" | "color" | "imageResource" | "layer" | "stringWithSelector" | "numberWithChoices" | ...
 * @property {string} [description]
 * @property {string} [supplementaryInformation]
 * @property {boolean} [optional]
 * @property {string} [defaultValue]
 * @property {string} [longDescription]
 */

/** @param {ParamDef} p */
const buildParam = (p) => {
  const out = {
    description: p.description || "",
    name: p.name,
    type: p.type,
  };
  if (p.supplementaryInformation !== undefined)
    out.supplementaryInformation = p.supplementaryInformation;
  if (p.optional !== undefined) out.optional = p.optional;
  if (p.defaultValue !== undefined) out.defaultValue = p.defaultValue;
  if (p.longDescription !== undefined) out.longDescription = p.longDescription;
  return out;
};

/**
 * @typedef {Object} FunctionDef
 * @property {"Action"|"Condition"|"Expression"|"StringExpression"|"ExpressionAndCondition"} kind
 * @property {string} name
 * @property {string} [fullName]
 * @property {string} [description]
 * @property {string} [sentence]
 * @property {string} [group]
 * @property {boolean} [private]
 * @property {boolean} [async]
 * @property {string|string[]} js - the inlineCode body (joined with \n if an array)
 * @property {string} [parameterObjects] - name of the objectList parameter auto-injected as `objects`, per rule #3/#10 in the README
 * @property {ParamDef[]} [params]
 */

const expressionTypeFor = (kind) => {
  if (kind === "StringExpression") return { type: "string" };
  if (kind === "Expression" || kind === "ExpressionAndCondition")
    return { type: "expression" };
  return null;
};

/** @param {FunctionDef} def */
const buildFunction = (def) => {
  const inlineCode = Array.isArray(def.js) ? def.js : def.js.split("\n");
  // Every JsCode block needs a trailing empty string entry to match how the
  // GDevelop editor itself serializes it (harmless if omitted, kept for
  // diff-friendliness against editor-exported extensions).
  if (inlineCode[inlineCode.length - 1] !== "") inlineCode.push("");

  const out = {
    description: def.description || "",
    fullName: def.fullName || "",
    functionType: def.kind,
    name: def.name,
    sentence: def.sentence || "",
    events: [
      {
        type: "BuiltinCommonInstructions::JsCode",
        inlineCode,
        parameterObjects: def.parameterObjects || "",
        useStrict: true,
        eventsSheetExpanded: false,
      },
    ],
    parameters: (def.params || []).map(buildParam),
    objectGroups: [],
  };

  if (def.group !== undefined) out.group = def.group;
  if (def.private) out.private = true;
  if (def.async) out.async = true;

  const expressionType = expressionTypeFor(def.kind);
  if (expressionType) out.expressionType = expressionType;

  return out;
};

/**
 * @typedef {Object} BehaviorDef
 * @property {string} name
 * @property {string} fullName
 * @property {string} [description]
 * @property {string} [objectType] - restrict to one object type, e.g. "Scene3D::Model3DObject"; leave empty for any object
 * @property {FunctionDef[]} functions
 */

/** @param {BehaviorDef} def */
const buildBehavior = (def) => ({
  description: def.description || "",
  fullName: def.fullName,
  helpPath: "",
  iconUrl: "",
  name: def.name,
  objectType: def.objectType || "",
  previewIconUrl: "",
  eventsFunctions: def.functions.map(buildFunction),
  eventsFunctionsFolderStructure: { folderName: "__ROOT" },
  propertyDescriptors: [],
  propertiesFolderStructure: { folderName: "__ROOT" },
});

/**
 * @typedef {Object} ExtensionDef
 * @property {string} name
 * @property {string} fullName
 * @property {string} [shortDescription]
 * @property {string|string[]} [description]
 * @property {string} [category]
 * @property {string} [version]
 * @property {string[]} [tags]
 * @property {FunctionDef[]} [functions] - free functions (Tier 0-2 "global service" shape)
 * @property {BehaviorDef[]} [behaviors] - eventsBasedBehaviors (Tier 0-3 "attached to object" shape)
 */

/** @param {ExtensionDef} def */
const defineExtension = (def) => ({
  author: "",
  category: def.category || "",
  dimension: "",
  extensionNamespace: "",
  fullName: def.fullName,
  gdevelopVersion: "",
  helpPath: "",
  iconUrl: "",
  name: def.name,
  previewIconUrl: "",
  shortDescription: def.shortDescription || "",
  version: def.version || "0.1.0",
  description: def.description || "",
  tags: def.tags || [],
  authorIds: [],
  dependencies: [],
  globalVariables: [],
  sceneVariables: [],
  eventsFunctions: (def.functions || []).map(buildFunction),
  eventsFunctionsFolderStructure: { folderName: "__ROOT" },
  eventsBasedBehaviors: (def.behaviors || []).map(buildBehavior),
  eventsBasedObjects: [],
});

module.exports = { defineExtension, buildFunction, buildBehavior, buildParam };
