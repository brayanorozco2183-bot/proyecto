import { ContentGenerationPipeline } from '../src/pipelines/contentGenerationPipeline.js';
import { GenerationMission } from '../src/types/pipeline_v2.js';
import { AuditSentinel } from '../src/utils/auditSentinel.js';

async function runMadridFullFlowTest() {
    const pipeline = new ContentGenerationPipeline();
    
    // Explicitly enabling soft mode can help us see the result even if minor guards fail,
    // though for a "perfect" page we want it to pass in production mode.
    const mission: GenerationMission = {
        missionId: 'madrid-full-flow-test',
        niche: 'cerrajeros',
        city: 'Madrid',
        local_nap: {
            business_name: 'Cerrajeros Madrid Master',
            address: 'Gran Via, 1, Madrid',
            phone: '912345678'
        },
        mode: 'production',
        debugMode: true,
        clusterFolderName: 'cerrajeros-madrid-perfect'
    };

    console.log('🚀 [START] Full Flow Mission: Cerrajeros Madrid...');
    console.log('--- Phase Monitoring Enabled ---');

    try {
        const result = await (pipeline as any).run(mission);

        if (result.success) {
            console.log('✅ Mission Phase Completion Successful.');
            
            const renderedPage = (pipeline as any).lastRenderedPage;
            if (renderedPage) {
                console.log('🔍 [AUDIT] Starting Deep Quality Audit...');
                const auditReport = await AuditSentinel.audit(renderedPage, mission);
                
                console.log('\n================================================');
                console.log('           POST-DEPLOY AUDIT REPORT             ');
                console.log('================================================');
                console.log(`PASS: ${auditReport.passed ? '✅ YES' : '❌ NO'}`);
                console.log(`Lighthouse: Perf: ${auditReport.lighthouse.performance} | SEO: ${auditReport.lighthouse.seo}`);
                console.log(`Schema Valid: ${auditReport.schema_valid}`);
                
                if (auditReport.issues.length > 0) {
                    console.log('\n🚨 CRITICAL ISSUES:');
                    auditReport.issues.forEach(i => console.log(`  - ${i}`));
                } else {
                    console.log('\n✨ No critical issues found.');
                }

                if (auditReport.warnings.length > 0) {
                    console.log('\n⚠️  WARNINGS:');
                    auditReport.warnings.forEach(w => console.log(`  - ${w}`));
                }

                if (auditReport.recommendations.length > 0) {
                    console.log('\n💡 RECOMMENDATIONS:');
                    auditReport.recommendations.forEach(r => console.log(`  - ${r}`));
                }
                console.log('================================================\n');
                
                if (auditReport.passed) {
                    console.log('🏆 SUCCESS: The page meets the IMPECCABLE standard.');
                } else {
                    console.log('⛔ FAILURE: The page still requires minor adjustments.');
                }
            }
        } else {
            console.error('❌ Pipeline failed in execution:', result.error);
        }
    } catch (err) {
        console.error('💥 Fatal Crash during Test Flow:', err);
    }
}

runMadridFullFlowTest().catch(console.error);
