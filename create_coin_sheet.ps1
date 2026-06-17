$ErrorActionPreference = "Stop"

$inputPath = "C:\Codex Testing\test test.xlsx"
$outputPath = "C:\Codex Testing\test test - Coin.xlsm"

if (-not (Test-Path -LiteralPath $inputPath)) {
    throw "Input workbook not found: $inputPath"
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $workbook = $excel.Workbooks.Open($inputPath)

    $sales = $null
    foreach ($sheet in $workbook.Worksheets) {
        if ($sheet.Name -ieq "sales") {
            $sales = $sheet
            break
        }
    }
    if ($null -eq $sales) {
        throw "Could not find a sheet named 'sales'."
    }

    foreach ($sheet in @($workbook.Worksheets)) {
        if ($sheet.Name -ieq "Coin") {
            $sheet.Delete()
            break
        }
    }

    $coin = $workbook.Worksheets.Add()
    $coin.Name = "Coin"
    $coin.Activate()
    $coin.Cells.Clear()

    $lastRow = $sales.Cells($sales.Rows.Count, 4).End(-4162).Row
    if ($lastRow -lt 1) {
        $lastRow = 1
    }

    $groups = New-Object System.Collections.Generic.SortedSet[string]
    for ($row = 1; $row -le $lastRow; $row++) {
        $value = [string]$sales.Cells($row, 4).Text
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            [void]$groups.Add($value.Trim())
        }
    }

    $coin.Range("A1:D1").Merge()
    $coin.Range("A1").Value2 = "Coin Entry"
    $coin.Range("A1").Font.Bold = $true
    $coin.Range("A1").Font.Size = 16
    $coin.Range("A1").Interior.Color = 0xE6D8AD

    $coin.Range("A3").Value2 = "Product Group"
    $coin.Range("A5").Value2 = "Coin"
    $coin.Range("A3:A5").Font.Bold = $true
    $coin.Range("B3").Interior.Color = 0xF2F2F2
    $coin.Range("B5").Interior.Color = 0xF2F2F2
    $coin.Range("B5").NumberFormat = "0.00"
    $coin.Range("B3:B5").Borders.LineStyle = 1
    $coin.Range("A3:B5").VerticalAlignment = -4108
    $coin.Columns.Item("A").ColumnWidth = 18
    $coin.Columns.Item("B").ColumnWidth = 28
    $coin.Rows.Item(1).RowHeight = 28

    $helperRow = 2
    foreach ($group in $groups) {
        $coin.Cells($helperRow, 5).Value2 = $group
        $helperRow++
    }
    if ($helperRow -eq 2) {
        $coin.Cells(2, 5).Value2 = ""
        $helperRow = 3
    }
    $listAddress = '=$E$2:$E$' + ($helperRow - 1)
    $coin.Range("B3").Validation.Delete()
    $coin.Range("B3").Validation.Add(3, 1, 1, $listAddress)
    $coin.Range("B3").Validation.IgnoreBlank = $true
    $coin.Range("B3").Validation.InCellDropdown = $true
    $coin.Columns.Item("E").Hidden = $true

    $coin.Range("A8:D10").Merge()
    $coin.Range("A8").Value2 = "Select a Product Group, enter the Coin value, then press submit. The macro writes the Coin number to column Y on the sales sheet for every matching Product Group in column D."
    $coin.Range("A8").WrapText = $true
    $coin.Range("A8").Font.Color = 0x666666

    $module = $workbook.VBProject.VBComponents.Add(1)
    $module.Name = "CoinSubmitModule"
    $macro = @"
Option Explicit

Public Sub SubmitCoin()
    Dim wsCoin As Worksheet
    Dim wsSales As Worksheet
    Dim productGroup As String
    Dim coinValue As Variant
    Dim lastRow As Long
    Dim rowIndex As Long
    Dim updateCount As Long

    Set wsCoin = ThisWorkbook.Worksheets("Coin")
    Set wsSales = ThisWorkbook.Worksheets("sales")

    productGroup = Trim(CStr(wsCoin.Range("B3").Value))
    coinValue = wsCoin.Range("B5").Value

    If productGroup = "" Then
        MsgBox "Please select Product Group.", vbExclamation, "Coin"
        Exit Sub
    End If

    If Len(Trim(CStr(coinValue))) = 0 Or Not IsNumeric(coinValue) Then
        MsgBox "Please enter a numeric Coin value.", vbExclamation, "Coin"
        Exit Sub
    End If

    lastRow = wsSales.Cells(wsSales.Rows.Count, "D").End(xlUp).Row
    updateCount = 0

    For rowIndex = 1 To lastRow
        If Trim(CStr(wsSales.Cells(rowIndex, "D").Value)) = productGroup Then
            wsSales.Cells(rowIndex, "Y").Value = CDbl(coinValue)
            updateCount = updateCount + 1
        End If
    Next rowIndex

    MsgBox "Updated " & updateCount & " row(s) in sales column Y.", vbInformation, "Coin"
End Sub
"@
    $module.CodeModule.AddFromString($macro)

    $left = $coin.Range("B7").Left
    $top = $coin.Range("B7").Top
    $button = $coin.Buttons().Add($left, $top, 120, 32)
    $button.Caption = "submit"
    $button.OnAction = "SubmitCoin"
    $button.Font.Bold = $true

    $sales.Columns.Item("Y").NumberFormat = "0.00"
    if ([string]::IsNullOrWhiteSpace([string]$sales.Cells(1, 25).Text)) {
        $sales.Cells(1, 25).Value2 = "Coin"
        $sales.Cells(1, 25).Font.Bold = $true
    }

    $workbook.SaveAs($outputPath, 52)
    $workbook.Close($true)
    Write-Output "Created: $outputPath"
}
finally {
    if ($null -ne $excel) {
        $excel.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
}
