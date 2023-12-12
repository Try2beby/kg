import { updateGraph } from "./net.js";

// searchResults.js
class searchResults extends React.Component {
    constructor(props) {
        super(props);
        this.state = { results: [] };
        this._isMounted = false; // Add this line
    }

    componentDidMount() {
        this._isMounted = true; // Set the flag to true when the component has mounted
    }

    componentWillUnmount() {
        this._isMounted = false; // Set the flag to false when the component will unmount
    }

    updateResults(newResults) {
        if (this._isMounted) { // Only update the state if the component is mounted
            this.setState({ results: newResults });
        }
    }

    render() {
        return React.createElement('div', {},
            this.state.results.map(result =>
                React.createElement('p', {
                    key: result.item, className: 'search-result',
                    onClick: () => {
                        updateGraph(result.item, true);
                    }
                }, result.item)
            )
        );
    }
}

export default searchResults;