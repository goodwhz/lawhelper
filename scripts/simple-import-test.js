const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const supabase = createClient(
  'https://duyfvvbgadrwaonvlrun.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWZ2dmJnYWRyd2FvbnZscnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODM2MjAsImV4cCI6MjA3NTg1OTYyMH0.3wExEYQ0PcdEqcML9WsvM36A74gBBXjfmmtbilwsUZ0',
)

async function testSimpleInsert() {
  try {
    console.log('测试简单插入...')

    const testData = {
      title: '劳动保障监察条例',
      content: '劳动保障监察条例（2004年11月1日 中华人民共和国国务院令第423号公布 自2004年12月1日起施行）第一章 总 则第一条 为了贯彻实施劳动保障法律、法规和规章，规范劳动保障监察工作，维护劳动者的合法权益，根据劳动法和有关法律，制定本条例。第二条 对企业和个体工商户（以下称用人单位）进行劳动保障监察，适用本条例。第三条 国务院劳动保障行政部门主管全国的劳动保障监察工作。县级以上地方各级人民政府劳动保障行政部门主管本行政区域内的劳动保障监察工作。',
      category_id: 'd45b6300-fd05-4ff4-b25a-c603a7cf697b',
      document_type: '国家行政法规',
      document_number: null,
      publish_date: '2004-11-01',
      effective_date: null,
      expire_date: null,
      file_path: 'national-administrative-regulations/labor-inspection-regulations-20041101.pdf',
      file_size: 21661,
      file_type: '.pdf',
      download_count: 0,
      view_count: 0,
      is_published: true,
      is_featured: false,
      keywords: null,
      tags: null,
    }

    console.log('插入的数据:', JSON.stringify(testData, null, 2))

    const { data, error } = await supabase
      .from('law_documents')
      .insert(testData)
      .select()

    if (error) {
      console.error('插入失败:', error)
      console.error('错误详情:', JSON.stringify(error, null, 2))
    } else {
      console.log('插入成功:', data)
    }
  } catch (err) {
    console.error('测试插入出错:', err)
  }
}

testSimpleInsert()
