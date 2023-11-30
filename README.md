更新日期：2023-11-30
# TARGET

### 1. 抽取命名实体 + 2. 抽取关系

1. 参考知识图谱书本的结构，关系分为`目录`, `前置`, `句子共现`, `段落共现`, `频繁项集`  
   以上关系**自定义规则**抽取即可
1. ~~问题在于，以上关系仅考虑位置，未考虑**语义信息**  
   需要对关系列表进行扩张，考虑实体与实体间的语义信息，如{`'LSTM'`, `'isA'`, `'RNN'`}  
   需要先观察抽取出的命名实体，再进一步计划需要扩张哪些关系~~
1. 可以用 [@Try2beby](https://github.com/Try2beby) 的方法同时抽取关系和实体，其中包含了语义信息，不过需要清理
1. 把 [@Try2beby](https://github.com/Try2beby) 结果中的实体提取出来，进一步做第一点中的结构关系

### 3. 实现知识图谱

- 将数据储存为 json 格式，用 java 制作知识图谱 (pending to explore)

# Work In Progress

1. ~~制作**目录架构**，包括**名称与序号**的对应关系，以及**序号与页码**的对应关系~~
2. ~~制作**内容架构**，包括**段落表**和**句子表**~~
3. 已测试抽取关系，所用模型 [rebel]([Babelscape/rebel-large · Hugging Face](https://huggingface.co/Babelscape/rebel-large))
4. 目录及前置关系制作

# TO-DO List

1. ~~探索 spaCy package，查看抽取出的实体的质量~~

2. 自定义规则，实现`目录`, `前置`, `句子共现`, `段落共现`, `频繁项集`该 5 个关系

3. ~~扩张关系列表，考虑语义信息~~

4. 探索 JavaScript(d3) or Python 可视化知识图谱的方式

   > 图表示

5. 抽取全书的实体和关系，并**进行清理**

   1. ```txt
      {'head': '1900', 'type': 'point in time', 'tail': '1900'}
      
      {'head': 'DeepLearning', 'type': 'use', 'tail': 'reinforcement learning'}
      {'head': 'Deep learning', 'type': 'use', 'tail': 'reinforcement learning'}
      {'head': 'deep learning', 'type': 'uses', 'tail': 'GPUs'}
      
      {'head': 'Applied Math and Machine Learning Basics', 'type': 'number of episodes', 'tail': '29'}
      {'head': 'Applied Math and Machine Learning Basics 29', 'type': 'point in time', 'tail': '29'}
      ```

6. 从上一步生成的三元组中提取实体

   > 如上，实体可能需要一些进一步的筛选

7. 用抽取到的实体进一步做结构关系

   > 建立图

# Question

1. 段落与句子的划分怎么样才能更加细致

1. ~~新增的、考虑语义信息的关系应该如何抽取~~

1. ~~如何设计 json 的架构，以更加方便地用 java 制作知识图谱~~{'head': '', 'type': '', 'tail': ''}

1. 如何降噪

1. 找到所有实体后，应该怎么做句子共现和段落共现？ $o(n^2m)$

   > 可能算法和相关概念，频繁项集、AC自动机
