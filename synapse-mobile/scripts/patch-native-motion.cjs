/* Narrow, version-checked Fabric lifecycle fix. Reapply after dependency install.
 * A removed node must not be resurrected by the pending update batch. Native
 * draw callbacks must also avoid dispatching synchronous props to absent views.
 * Both changes are validated before either file is written. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','node_modules/react-native-reanimated');
if(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version!=='4.5.1')throw Error('Review native motion patch for the installed Reanimated version');
const changes=[
 ['android/src/main/java/com/swmansion/reanimated/NodesManager.kt',
 '            if (UiThreadUtil.isOnUiThread()) {\n                // Ensure draw-pass tracking',
 `            if (UiThreadUtil.isOnUiThread()) {
                // Lume: SVG layout notifications without an animation listener
                // must not replay the whole props registry inside View.draw().
                val resolvedName = mCustomEventNamesResolver.resolveCustomEventName(event.eventName) ?: event.eventName
                if ((event.eventName == "topLayout" || event.eventName == "topSvgLayout") &&
                    !mNativeProxy!!.isAnyHandlerWaitingForEvent(resolvedName, event.viewTag)) return
                // Ensure draw-pass tracking`],
 ['Common/cpp/reanimated/Events/UIEventHandlerRegistry.cpp',
 '  const auto eventHash = std::make_pair(emitterReactTag, eventName);\n  auto it = eventMappingsWithTag.find(eventHash);',
 `  // Lume: global listeners are real consumers too, including layout listeners.
  const auto global = eventMappingsWithoutTag.find(eventName);
  if (global != eventMappingsWithoutTag.end() && !global->second.empty()) return true;
  const auto eventHash = std::make_pair(emitterReactTag, eventName);
  auto it = eventMappingsWithTag.find(eventHash);`],
 ['Common/cpp/reanimated/Fabric/updates/UpdatesRegistry.cpp',
 '  removeTag(tag);',
 `  // Lume: retire queued props with the removed Fabric family.
  UpdatesBatch pending;
  for (auto &entry : updatesBatch_) {
    if (entry.first->getTag() != tag) pending.push_back(std::move(entry));
  }
  updatesBatch_ = std::move(pending);
#if REACT_NATIVE_VERSION_MINOR >= 85
  UpdatesBatchAnimatedProps typedPending;
  for (auto &entry : updatesBatchAnimatedProps_) {
    if (entry.shadowNodeFamily->getTag() != tag) typedPending.push_back(std::move(entry));
  }
  updatesBatchAnimatedProps_ = std::move(typedPending);
#endif
  removeTag(tag);`],
 ['android/src/main/java/com/swmansion/reanimated/NativeProxy.kt',
 '    private val updatePropsSynchronouslyMethod by lazy {',
 `    private val getViewExistsMethod by lazy {
        mountingManager.javaClass.getMethod("getViewExists", Int::class.javaPrimitiveType)
            .apply { isAccessible = true }
    }

    private val updatePropsSynchronouslyMethod by lazy {`],
 ['android/src/main/java/com/swmansion/reanimated/NativeProxy.kt',
 '                    updatePropsSynchronouslyMethod.invoke(mountingManager, viewTag, props)',
 `                    // Lume: a draw event can outlive a native view's mount.
                    // Do not construct an exception/stack on every SVG draw.
                    if (!(getViewExistsMethod.invoke(mountingManager, viewTag) as Boolean)) return@parse
                    updatePropsSynchronouslyMethod.invoke(mountingManager, viewTag, props)`]
];
const prepared=new Map();
for(const [file,before,after]of changes){
 const target=path.join(root,file),text=prepared.get(target)??fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n');
 if(text.includes(after))continue;
 if(text.split(before).length!==2)throw Error('Native patch context changed: '+file);
 prepared.set(target,text.replace(before,after));
}
for(const [file,text]of prepared)fs.writeFileSync(file,text);
console.log('Reanimated 4.5.1 Fabric lifecycle patch verified');
