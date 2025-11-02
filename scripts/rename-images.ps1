# Rename all plant images to lowercase
$path = "C:\Users\adams\OneDrive\Documents\Coding Projects\Adams Eden\assets\images\plants"

Get-ChildItem "$path\*.jpg" | ForEach-Object {
    $newName = $_.Name.ToLower()
    if ($_.Name -cne $newName) {
        Write-Host "Renaming: $($_.Name) -> $newName"
        Rename-Item $_.FullName -NewName $newName
    }
}

Write-Host "`n✅ All images renamed to lowercase!"
