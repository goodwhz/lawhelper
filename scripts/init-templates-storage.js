const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 配置Supabase客户端
const supabaseUrl = "https://duyfvvbgadrwaonvlrun.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initTemplatesStorage() {
  console.log('开始初始化模板存储...');

  try {
    // 1. 检查存储桶是否存在，如果不存在则创建
    console.log('检查存储桶...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('获取存储桶列表失败:', bucketsError);
      throw bucketsError;
    }

    const templatesBucket = buckets.find(bucket => bucket.name === 'templates');
    
    if (!templatesBucket) {
      console.log('创建 templates 存储桶...');
      const { error: createError } = await supabase.storage.createBucket('templates', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'text/plain']
      });

      if (createError) {
        console.error('创建存储桶失败:', createError);
        throw createError;
      }
      console.log('✅ 存储桶创建成功');
    } else {
      console.log('✅ 存储桶已存在');
    }

    // 2. 上传现有模板文件
    console.log('上传现有模板文件...');
    const templatesDir = path.join(__dirname, '..', 'template');
    
    if (!fs.existsSync(templatesDir)) {
      console.log('⚠️  模板目录不存在，跳过文件上传');
      return;
    }

    const files = fs.readdirSync(templatesDir);
    
    for (const filename of files) {
      if (!filename.endsWith('.doc')) continue;
      
      const filePath = path.join(templatesDir, filename);
      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      
      // 检查文件是否已存在
      const { data: existingFiles } = await supabase.storage
        .from('templates')
        .list('', { search: filename });
      
      if (existingFiles && existingFiles.length > 0) {
        console.log(`📁 ${filename} 已存在，跳过`);
        continue;
      }

      // 上传文件
      console.log(`⬆️  上传 ${filename}...`);
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filename, fileBuffer, {
          contentType: 'application/msword',
          upsert: false
        });

      if (uploadError) {
        console.error(`上传 ${filename} 失败:`, uploadError);
      } else {
        console.log(`✅ ${filename} 上传成功`);
      }
    }

    // 3. 更新数据库中的文件路径
    console.log('更新数据库记录...');
    
    // 获取所有模板记录
    const { data: templates, error: templatesError } = await supabase
      .from('document_templates')
      .select('*');

    if (templatesError) {
      console.error('获取模板记录失败:', templatesError);
      throw templatesError;
    }

    for (const template of templates || []) {
      // 检查文件是否在存储桶中
      const { data: fileExists } = await supabase.storage
        .from('templates')
        .list('', { search: template.file_name });
      
      if (!fileExists || fileExists.length === 0) {
        console.log(`⚠️  文件 ${template.file_name} 不在存储桶中，跳过更新`);
        continue;
      }

      // 更新文件路径
      const { error: updateError } = await supabase
        .from('document_templates')
        .update({ 
          file_path: template.file_name,
          file_size: fileExists[0]?.metadata?.size || 0
        })
        .eq('id', template.id);

      if (updateError) {
        console.error(`更新模板 ${template.title} 失败:`, updateError);
      } else {
        console.log(`✅ ${template.title} 更新成功`);
      }
    }

    console.log('🎉 模板存储初始化完成！');

  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initTemplatesStorage();