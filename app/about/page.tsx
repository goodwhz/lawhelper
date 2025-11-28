'use client'
import type { FC } from 'react'
import React from 'react'
import Navigation from '@/app/components/navigation'

const AboutPage: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-law-red-50 via-law-orange-50 to-law-blue-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-law-red-800 font-hei mb-8">
            《冷静头脑CoolBrain服务协议》
          </h1>

          <div className="prose prose-lg max-w-none font-hei">
            <p className="text-gray-600 mb-6 text-center">最后更新日期：2025年11月4日</p>

            <h2 className="text-xl font-bold text-law-red-700 mb-4 mt-8">1. 接受条款</h2>
            <p className="text-gray-700 mb-4">
              1.1 冷静头脑CoolBrain（以下简称"本平台"）由冷头科技所有并运营，包括网页版（lawhelper-kappa.vercel.app）及未来开发的应用程序、小程序等形态。请您在开始使用本平台之前，认真阅读并充分理解本协议。其中，免除或者限制责任条款等重要内容将以加粗形式提示您注意，您应重点阅读。如您未满18周岁，请在法定监护人陪同下仔细阅读并充分理解本协议，并征得法定监护人的同意后使用本平台。如您不同意本协议的任何内容，请立即停止使用本平台。
            </p>
            <p className="text-gray-700 mb-6">
              1.2 冷头科技保留随时修改本协议的权利，变更自发布时生效。继续使用本平台视为接受变更，用户有责任定期查看协议更新。
            </p>

            <h2 className="text-xl font-bold text-law-red-700 mb-4 mt-8">2. 服务内容</h2>
            <p className="text-gray-700 mb-4">
              2.1 本平台提供合同审查、法律问答等服务，具体功能以实际展示为准。
            </p>
            <p className="text-gray-700 mb-4">
              2.2 为优化服务，我们可能不定期更新平台功能，用户可自行选择是否继续使用。
            </p>
            <p className="text-gray-700 mb-6">
              2.3 您在使用本平台时，应遵守国家法律法规、行政规章以及本平台的相关规定。您不得以任何形式对本平台进行包括但不限于改编、复制、传播、垂直搜索、镜像或交易等未经授权的访问或使用。
            </p>

            <h2 className="text-xl font-bold text-law-red-700 mb-4 mt-8">3. 知识产权</h2>
            <p className="text-gray-700 mb-4">
              3.1 本平台使用的所有商标，未经本公司或相关权利人书面授权，任何组织、单位或个人不得出于盈利目的或者以恶意方式使用。
            </p>
            <p className="text-gray-700 mb-4">
              3.2 本平台上所有内容的著作权归本公司或相关权利人所有，受包括但不限于中华人民共和国著作权法的相关法律法规以及国际条约的保护。
            </p>
            <p className="text-gray-700 mb-6">
              3.3 未经本公司事先书面许可，互联网任何主体不得使用机器人、蜘蛛、爬虫等其他自动设备或程序，或者手动程序复制、传播本平台包含的内容。一经发现，本公司有权立即对该用户终止服务，并保留追究相应法律责任的权利。
            </p>

            <h2 className="text-xl font-bold text-law-red-700 mb-4 mt-8">4. 用户行为规范</h2>
            <p className="text-gray-700 mb-4">
              您应当对您使用本平台软件及相关服务的行为负责，除非法律允许或者经我们事先书面许可，您使用本平台不得具有下列行为：
            </p>
            <p className="text-gray-700 mb-4">
              4.1 使用未经我们授权或许可的任何插件、外挂、系统或第三方工具对本平台的正常运行进行干扰、破坏、修改或施加其他影响。
            </p>
            <p className="text-gray-700 mb-6">
              4.2 利用或针对本平台进行任何危害计算机网络安全的行为，包括但不限于：非法侵入网络、干扰网络正常功能、窃取网络数据等危害网络安全的活动。
            </p>

            <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">5. 收费条款</h3>
            <p className="text-gray-700 mb-6">
              本平台服务包括收费服务和免费服务。对于收费服务，本公司会在用户使用之前给予明确的提示，只有用户根据提示确认相关内容、支付费用后，才可以使用相关收费服务。如用户拒绝确认相关内容或支付费用，则本公司有权不向用户提供该等收费服务。
            </p>

            <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">6. 隐私政策</h3>
            <p className="text-gray-700 mb-6">
              隐私政策是用户与本公司之间就本平台如何收集、使用个人信息，以及用户对其个人信息享有何种权利等问题的相关约定。用户应当在完成注册和使用本平台之前阅读、理解本隐私政策的所有条款，并同意受其约束。若您不同意相关隐私政策，请勿使用本平台服务。
            </p>

            <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">7. 免责声明</h3>
            <p className="text-gray-700 mb-4">
              7.1 您使用本平台获取的任何信息和内容，不代表我们的观点和看法，与我们的立场无关，不构成任何的销售、建议。
            </p>
            <p className="text-gray-700 mb-4">
              7.2 您使用本平台获取的信息和内容仅能作为参考，我们不保证这些信息和内容的真实、正确、完整、合法有效，对于您因使用或信赖该等信息、内容作出的任何决策、决定和行为，以及因此产生的任何直接或间接损失，我们均不承担任何责任。
            </p>
            <p className="text-gray-700 mb-6">
              7.3 如果因国家相关行业主管部门、通信网络、计算机病毒、黑客攻击、用户关机以及其他我们控制范围外的硬件故障或其它不可抗力原因等，造成服务中断暂停、数据丢失损坏以及给您造成其他损失的，我们免责，不承担任何法律责任。
            </p>

            <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">8. 违约责任</h3>
            <p className="text-gray-700 mb-6">
              8.1 若您违反本协议或其他服务条款规定，您应当承担相应的违约责任，包括但不限于采取补救错误、支付违约金、赔偿损失等，赔偿范围包括但不限于律师费、仲裁费、诉讼费、财产保全担保费、鉴定费、公证费等合理费用。
            </p>

            <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">9. 法律适用与争议解决</h3>
            <p className="text-gray-700 mb-4">
              9.1 本协议适用中华人民共和国法律。
            </p>
            <p className="text-gray-700 mb-6">
              9.2 争议应友好协商，协商不成提交南京仲裁委员会仲裁。
            </p>

            <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">10. 一般条款</h3>
            <p className="text-gray-700 mb-4">
              10.1 协议部分条款无效不影响其余条款效力。
            </p>
            <p className="text-gray-700 mb-4">
              10.2 律捷科技有权将本协议权利义务转让给第三方，并通过平台公告告知用户。
            </p>
            <p className="text-gray-700 mb-4">
              10.3 本协议自用户注册时生效，终止服务时失效。
            </p>
            <p className="text-gray-700 mb-6">
              10.4 最终解释权归律捷科技所有。
            </p>

            <div className="border-t border-gray-200 mt-8 pt-8">
              <h2 className="text-2xl font-bold text-law-red-800 mb-4 font-hei">《冷头CoolBrain隐私协议》</h2>
              <p className="text-gray-600 mb-6 text-center">最后更新日期：2025年11月4日</p>

              <p className="text-gray-700 mb-6">
                感谢使用我们的产品和服务。本隐私政策是用户（包括注册用户及未注册的访客，以下通称为"您"）以注册、访问或浏览方式使用律捷LawJet（以下简称"本平台"）的产品与服务时与我们签署的协议的组成部分。为更好地使用我们的产品与服务，您需阅读、理解本隐私政策的所有条款，并同意受其约束。若您不同意本隐私政策，请勿使用我们的产品与服务。
              </p>

              <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">一、如何收集、使用您的信息</h3>
              <p className="text-gray-700 mb-6">
                个人信息是指电子或者其他方式记录的与已识别或者可识别的自然人有关的各种信息，不包括匿名化处理后的信息。包括但不限于：基于以下目的，由您提供或我们获取的您的姓名、年龄、性别、出生日期、证件号码、电话（包括手机）、微信或 QQ 等社交媒体账号、电子邮箱、银行账户等信息。
              </p>

              <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">二、如何委托处理、共享、转让、公开披露您的信息</h3>
              <p className="text-gray-700 mb-6">
                本平台目前需收集的上述个人信息由我们进行处理，如后续因开发新形态、功能及模块而需收集、处理您的其他个人信息且需引入第三方供应商的，我们将严格对第三方供应商进行资质审核、签订数据保护协议与保密协议，同时在进行上述委托行为之前，向您进行告知、并获取您的授权。
              </p>

              <h3 className="text-lg font-bold text-law-red-600 mb-4 mt-6">三、如何存储、保护您的信息</h3>
              <p className="text-gray-700 mb-6">
                基于相关法律法规的规定，以及我们收集、使用个人信息的目的，我们仅在法律法规要求的时限及本隐私政策所明示目的所需的最短期限内存储您的信息。除非需要延长存储期限或受到法律的允许，否则我们将在个人信息收集目的完成后，及时予以删除或进行匿名化处理（经匿名化处理后的信息不再属于个人信息）。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
