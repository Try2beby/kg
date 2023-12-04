更新日期：2023-12-03
# TARGET

## 1. 抽取命名实体与关系

1. 定义Book类获取书本内容
2. 利用[rebel](https://huggingface.co/Babelscape/rebel-large)抽取语义关系
3. 利用wikipedia去重，降噪
4. 从关系中抽取实体
5. 利用AC自动机寻找位置关系

## 2. 实现知识图谱

- 利用java制图
- 利用Pyvix制图

# TO-DO LIST

- [x] 定义book类
- [x] 语义关系抽取
   - [x] 分段(pages)抽取关系
   - [x] 关系合并,wikipedia去重
   - [ ] 降噪
- [x] 位置关系
   - [x] AC自动机
   - [x] 目录、前置、包含
   - [x] 段落共现、句子共现
   - [ ] 频繁项集
- [ ] 制作知识图谱
   - [ ] 关系整合与导出
   - [ ] 制作图谱

# Questions

- [ ] 段落与句子的划分怎么样才能更加细致
- [x] 新增的、考虑语义信息的关系应该如何抽取
   > 利用[rebel](https://huggingface.co/Babelscape/rebel-large)端到端抽取关系
- [x] 如何设计 json 的架构，以更加方便地用 java 制作知识图谱
   > {'head': '', 'type': '', 'tail': ''}
- [ ] 如何降噪
- [x] 找到所有实体后，应该怎么做句子共现和段落共现？
   > 利用AC自动机
- [ ] AC自动机可处理数据量是否有限制
- [ ] pyvix是否可以互动
- [ ] 是否可以将实体链接到对应的维基百科页面(对维基百科页面也进行一定程度的内容抽取?)
