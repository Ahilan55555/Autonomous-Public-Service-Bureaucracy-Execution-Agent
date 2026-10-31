from browser_agent.perception.observer import BrowserObserver


def main():

    observer = BrowserObserver()

    try:

        print("\nStarting browser...")

        observer.start()

        print("Navigating to example.com...")

        result = observer.navigate(
            "https://example.com"
        )

        print("\nNavigation result:")
        print(result)

        print("\nObserving webpage...")

        observation = observer.observe()

        print("\nPAGE TITLE:")
        print(observation["title"])

        print("\nHEADINGS:")
        for heading in observation["headings"]:
            print("-", heading)

        print("\nBUTTONS:")
        for button in observation["buttons"]:
            print("-", button)

        print("\nLINKS:")
        for link in observation["links"]:
            print("-", link)

        print("\nINPUT FIELDS:")
        for field in observation["input_fields"]:
            print("-", field)

        print("\nObservation successful!")

    finally:

        observer.close()


if __name__ == "__main__":
    main()