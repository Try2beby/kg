# 程序说明

## Book 类定义

- `loader` 加载 pdf 数据，返回 pdf 对象
- `close` 关闭 pdf 文件
- `readPage` 读入某一页
- `readPageInInterval` 读入某个范围内的页，`offset` 是正文之前的页数
- `searchStrInPage` 在某一页中用 `find` 方法查找字符串 str
- `getToc` 生成目录
- `loadToc` 加载目录
- `getChapter` 取出一章的内容

## REBEL 模型使用

- `extract_relations_from_model_output` 从模型输出中提取关系，返回类型 <head, type, tail> 三元组
- `KB` 类，封装了一个存储 `relations` 的列表
- `from_small_text_to_kb` 从短文本生成一个 kb
- 

# Build Knowledge Base

## Pipeline

在 Book 类能提供完善的对pdf中文本的截取、查找的基础上

- 提取实体(NER, Named Entity Recognition)
- 提取关系(RC, Relation Classification)

RE(Relation Extraction) 使用端到端模型同时解决以上任务

- 所用模型：[REBEL](https://huggingface.co/Babelscape/rebel-large) 相关文章 [REBEL: Relation Extraction By End-to-end Language generation - ACL Anthology](https://aclanthology.org/2021.findings-emnlp.204/)

  > 参考 [Building a Knowledge Base from Texts: a Full Practical Example | by Fabio Chiusano | NLPlanet | Medium](https://medium.com/nlplanet/building-a-knowledge-base-from-texts-a-full-practical-example-8dbbffb912fa) 补充REBEL模型的相关信息（参数量，训练集 etc.)

- 将 pdf 数据按 chapter/section/subsection 划分输入模型，观察效果

- 对提取出的实体进行筛选 

  - 实体链接(Entity Linking): 使用 `wikipedia` 库检查两个实体是否有相同的维基百科页面，若是，则合并。若提取出的实体没有对应的页面，则暂时忽略该实体. 

    > 考虑到该书并不是新近出版的，大部分实体在 Wikipedia 中都有对应页面

- 考虑更多的关系：`目录`, `前置`, `句子共现`, `段落共现`, `频繁项集`

  > 考虑使用AC自动机进行字符串匹配

- 以实体为节点，关系为边，使用`pyvis`进行图可视化

## Subtasks

- [x] 构建、维护 Book 类，得到文本数据集
- [x] 测试 REBEL 对章节文本的处理效果
- [x] 将数据集分块输入 REBEL，提取关系
- [x] 根据 Wikipedia 合并重复实体，去除冗余实体
- [ ] 进一步添加规则筛选 实体/关系类型
- [ ] 增加关系 `目录`, `前置`, `句子共现`, `段落共现`, `频繁项集`
- [ ] 可视化







