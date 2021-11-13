
const import_notification = {

  set success(enableNotif) {

    enableNotif ? atom.notifications.addSuccess(`New import added!`) : 0;
  },

  notify: (options, fromFileType, toFileType) => {
    const { isSameValid, notSupportedValid, invalidFile, isDirectory } = options;
    const notif = atom.notifications;
    const append = fromFileType.toUpperCase().slice(1);

    console.log(options);

    invalidFile                                               ? notif.addWarning(`Unable to import ${fromFileType} to ${toFileType}.`)
    : isDirectory && toFileType !== ''                        ?   notif.addError('File not found.')
    : fromFileType === '' && toFileType === ''                ?   notif.addError('Active pane not found.')
    : !invalidFile && isSameValid                             ?    notif.addInfo('Same file path.')
    : !invalidFile && notSupportedValid                       ? notif.addWarning(`${append} files not supported.`)
    : !invalidFile && !isSameValid && notSupportedValid === 0 ? notif.addWarning(`Same file path. ${append} files not supported.`)
    : !invalidFile && !notSupportedValid && isSameValid === 0 ?   notif.addError('Import failed.') : 0;
  }

};

module.exports = { import_notification };
