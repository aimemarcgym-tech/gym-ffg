' Lance l'aide « Faire ces musiques » sans fenêtre (utilisé au démarrage de Windows et par le bouton « Démarrer l'aide » de l'appli).
Set fso = CreateObject("Scripting.FileSystemObject")
racine = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
CreateObject("WScript.Shell").Run "cmd /c cd /d """ & racine & """ && node tools\aide-musique.mjs", 0, False
