' Lance l'aide « Faire ces musiques » sans fenêtre (utilisé au démarrage de Windows et par le bouton « Démarrer l'aide » de l'appli).
Set fso = CreateObject("Scripting.FileSystemObject")
dossier = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("WScript.Shell").Run "cmd /c """ & dossier & "\aide-boucle.cmd""", 0, False
