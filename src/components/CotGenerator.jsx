import React, { useState, useEffect } from 'react';

const SYSTEM_PROMPT = `你是一个专家级的AI助手，能够逐步解释推理过程。你将收到一个问题和相关参考资料。你的任务是重构并展示通向正确答案的完整推理路径。

对于每个推理步骤，提供一个标题，描述你在该步骤中所做的事情，以及内容。但必须展示至少三种不同的方法或途径来得出该答案。

要求：
1. 使用3-5个推理步骤
2. 探索多种方法以达到答案
3. 通过不同的方法验证给定答案
4. 考虑潜在的替代答案并解释为何被拒绝
5. 你必须假装没有参考资料，只可以把参考资料当作自己的知识
6. 考虑你可能是错的，如果你的推理是错的，它会在哪里
7. 充分测试所有其他可能性。你可能会错
8. 当你说你正在重新检查时，请真正重新检查，并使用另一种方法进行，不要只是说你正在重新检查`;

const CotGenerator = ({ config, fileContent, onDataGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [questionCount, setQuestionCount] = useState(3); // 默认生成3个问题
  const [editableQuestions, setEditableQuestions] = useState([]); // 存储可编辑的问题

  // 当生成数据时，初始化可编辑的问题
  useEffect(() => {
    if (generatedData) {
      setEditableQuestions(generatedData.map(item => ({
        question: item.question,
        isEditing: false
      })));
    }
  }, [generatedData]);

  const parseAIResponse = (response) => {
    // 尝试多种方式解析JSON
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/, // JSON代码块
      /```\s*([\s\S]*?)\s*```/,     // 普通代码块
      /(\[[\s\S]*\])/               // 任何数组格式
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) {
        try {
          const extracted = match[1].trim();
          const parsed = JSON.parse(extracted);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.log('当前模式解析失败，尝试下一个模式');
        }
      }
    }

    // 尝试直接解析整个响应
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.log('直接解析失败');
    }

    throw new Error('无法解析为有效的JSON格式');
  };

  // 处理问题编辑
  const handleQuestionEdit = (index, newQuestion) => {
    const newQuestions = [...editableQuestions];
    newQuestions[index] = {
      ...newQuestions[index],
      question: newQuestion
    };
    setEditableQuestions(newQuestions);

    // 同时更新生成的数据
    const newGeneratedData = [...generatedData];
    newGeneratedData[index] = {
      ...newGeneratedData[index],
      question: newQuestion
    };
    setGeneratedData(newGeneratedData);
  };

  // 切换问题的编辑状态
  const toggleQuestionEdit = (index) => {
    const newQuestions = [...editableQuestions];
    newQuestions[index] = {
      ...newQuestions[index],
      isEditing: !newQuestions[index].isEditing
    };
    setEditableQuestions(newQuestions);
  };

  const generateCotData = async () => {
    if (!fileContent) {
      setError('请先上传或输入参考资料');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${config.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `参考资料：\n${fileContent}\n\n请基于以上参考资料生成${questionCount}个问题并进行推理分析。请确保返回的是标准的JSON格式，格式如下：
              [
                {
                  "question": "问题1",
                  "reasoning_steps": [
                    {
                      "title": "步骤1标题",
                      "content": "步骤1详细内容",
                      "next_action": "continue"
                    },
                    {
                      "title": "最终结论",
                      "content": "总结性结论",
                      "next_action": "final_answer"
                    }
                  ]
                }
              ]`
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      console.log('AI原始响应:', aiResponse); // 调试用

      try {
        const jsonData = parseAIResponse(aiResponse);
        
        // 修改数据结构，将最后一步的内容作为 final_answer
        const formattedData = jsonData.map(item => {
          const lastStep = item.reasoning_steps[item.reasoning_steps.length - 1];
          return {
            question: item.question,
            reasoning_steps: item.reasoning_steps.slice(0, -1), // 除去最后一步
            final_answer: lastStep.content
          };
        });

        setGeneratedData(formattedData);
        if (onDataGenerated) {
          onDataGenerated(formattedData);
        }
      } catch (e) {
        console.error('JSON解析错误:', e);
        throw new Error(`AI响应格式错误: ${e.message}`);
      }
    } catch (err) {
      setError(`生成失败: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 确认生成最终数据
  const handleConfirmGeneration = () => {
    if (onDataGenerated && generatedData) {
      onDataGenerated(generatedData);
    }
  };

  return (
    <div className="space-y-6">
      {/* 问题数量设置 */}
      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium text-gray-700">
          生成问题数量:
        </label>
        <input
          type="number"
          min="1"
          max="10"
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-24 p-2 border rounded-md"
        />
        <span className="text-sm text-gray-500">
          (1-10个问题)
        </span>
      </div>

      <button
        onClick={generateCotData}
        disabled={isGenerating || !fileContent}
        className={`w-full py-3 rounded-md text-white font-medium ${
          isGenerating || !fileContent
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isGenerating ? '生成中...' : '生成 CoT 数据'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {generatedData && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">生成的问题列表:</h2>
          <div className="space-y-4">
            {editableQuestions.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">问题 {index + 1}:</span>
                  <button
                    onClick={() => toggleQuestionEdit(index)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    {item.isEditing ? '保存' : '编辑'}
                  </button>
                </div>
                {item.isEditing ? (
                  <textarea
                    value={item.question}
                    onChange={(e) => handleQuestionEdit(index, e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  />
                ) : (
                  <p className="text-gray-700">{item.question}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">完整的 CoT 数据:</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(generatedData, null, 2)}
              </pre>
            </div>
          </div>

          <button
            onClick={handleConfirmGeneration}
            className="mt-4 w-full py-3 bg-green-500 text-white font-medium rounded-md hover:bg-green-600"
          >
            确认并添加到数据列表
          </button>
        </div>
      )}
    </div>
  );
};

export default CotGenerator; 