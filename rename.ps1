Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

# 1. 批量选择文件
$FileBrowser = New-Object System.Windows.Forms.OpenFileDialog
$FileBrowser.Title = "请选择要重命名的视频文件（按住 Ctrl 或 Shift 可多选）"
$FileBrowser.Filter = "视频文件 (*.mp4;*.mkv;*.flv;*.avi)|*.mp4;*.mkv;*.flv;*.avi|所有文件 (*.*)|*.*"
$FileBrowser.Multiselect = $true 
$null = $FileBrowser.ShowDialog()

if ($FileBrowser.FileNames.Count -eq 0) { exit }

$Files = $FileBrowser.FileNames
$Total = $Files.Count
$SuccessCount = 0
$SkipCount = 0

Write-Host "共选择了 $Total 个文件，开始处理..." -ForegroundColor Cyan
Write-Host "----------------------------------------"

# 2. 遍历选中的每个文件
for ($i = 0; $i -lt $Total; $i++) {
    $OriginalFile = $Files[$i]
    $OldName = [System.IO.Path]::GetFileName($OriginalFile)
    $Extension = [System.IO.Path]::GetExtension($OriginalFile)
    $Directory = [System.IO.Path]::GetDirectoryName($OriginalFile)
    
    # 3. 正则提取：月、日、时、分
    # 匹配格式：Camera_整场_9月14日_15_13
    $regex = 'Camera_整场_(\d+)月(\d+)日_(\d+)_(\d+)'
    
    if ($OldName -match $regex) {
        $month = $matches[1].PadLeft(2, '0')
        $day = $matches[2].PadLeft(2, '0')
        $hour = $matches[3].PadLeft(2, '0')
        $minute = $matches[4].PadLeft(2, '0')
        
        # 获取文件的修改年份，如果没有则用当前年份
        $fileItem = Get-Item $OriginalFile
        $year = $fileItem.LastWriteTime.Year
        
        $prefix = "$year$month$day`_$hour$minute`_"
    } else {
        # 如果文件名格式不符合，给出提示，默认用当前时间做前缀
        Write-Host "⚠️ 文件名格式不匹配规范: $OldName" -ForegroundColor Yellow
        $prefix = (Get-Date).ToString("yyyyMMdd_HHmm") + "_"
    }
    
    # 4. 弹窗输入标题
    $PromptMessage = "当前进度: $($i+1) / $Total`n`n原文件名: $OldName`n解析出的前缀: $prefix`n`n请输入标题 (留空跳过):"
    $NewTitle = [Microsoft.VisualBasic.Interaction]::InputBox($PromptMessage, "输入标题", "")
    
    if ([string]::IsNullOrWhiteSpace($NewTitle)) {
        Write-Host "⏭️ 已跳过: $OldName" -ForegroundColor Yellow
        $SkipCount++
        continue
    }
    
    # 清理标题中的非法字符
    $CleanTitle = $NewTitle -replace '[\\/:*?"<>|]', '_'
    
    # 5. 拼接最终的新文件名
    $FinalName = "$prefix$CleanTitle$Extension"
    $NewPath = Join-Path $Directory $FinalName
    
    # 6. 执行重命名
    try {
        Rename-Item -Path $OriginalFile -NewName $FinalName -ErrorAction Stop
        Write-Host "✅ 成功: $OldName" -ForegroundColor Green
        Write-Host "   -> $FinalName" -ForegroundColor Green
        $SuccessCount++
    } catch {
        Write-Host "❌ 失败: $OldName (原因: 新文件名可能已存在)" -ForegroundColor Red
    }
}

Write-Host "----------------------------------------"
Write-Host "处理完毕！成功: $SuccessCount 个，跳过: $SkipCount 个。" -ForegroundColor Cyan
Read-Host "按回车键退出..."